import asyncio
import base64
import hashlib
import hmac
import inspect
from typing import Any

from cryptography.fernet import Fernet

from ..core.config import Settings
from ..core.exceptions import IntegrityError


def derive_fernet_key(
    master_key: str,
    wallet_address: str,
    storage_id: str,
    payload_sha256: str,
) -> bytes:
    digest = hmac.new(
        master_key.encode("utf-8"),
        f"{wallet_address.lower()}:{storage_id}:{payload_sha256}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.urlsafe_b64encode(digest)


class EphemeralSandbox:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.backend = "local-fallback"
        self._sandbox: Any | None = None

    async def __aenter__(self) -> "EphemeralSandbox":
        if self.settings.e2b_api_key:
            try:
                from e2b_code_interpreter import AsyncSandbox

                self._sandbox = await AsyncSandbox.create()
                self.backend = "e2b"
            except Exception:
                self._sandbox = None
                self.backend = "local-fallback"
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if not self._sandbox:
            return

        close = getattr(self._sandbox, "close", None)
        if callable(close):
            result = close()
            if inspect.isawaitable(result):
                await result
            return

        kill = getattr(self._sandbox, "kill", None)
        if callable(kill):
            result = kill()
            if inspect.isawaitable(result):
                await result

    async def encrypt(
        self,
        payload: bytes,
        *,
        wallet_address: str,
        storage_id: str,
        payload_sha256: str,
    ) -> str:
        key = derive_fernet_key(
            self.settings.master_key,
            wallet_address,
            storage_id,
            payload_sha256,
        )
        if self._sandbox:
            try:
                return await asyncio.wait_for(
                    self._run_remote_crypto("encrypt", payload, key),
                    timeout=float(self.settings.request_timeout_seconds),
                )
            except Exception:
                if not self.settings.allow_local_tee_fallback:
                    raise IntegrityError(
                        "TEE encryption failed and local fallback is disabled.",
                        status_code=502,
                        layer="L3",
                    )
        return await asyncio.to_thread(self._encrypt_local, payload, key)

    async def decrypt(
        self,
        ciphertext_b64: str,
        *,
        wallet_address: str,
        storage_id: str,
        payload_sha256: str,
    ) -> bytes:
        key = derive_fernet_key(
            self.settings.master_key,
            wallet_address,
            storage_id,
            payload_sha256,
        )
        if self._sandbox:
            try:
                plaintext_b64 = await asyncio.wait_for(
                    self._run_remote_crypto(
                        "decrypt",
                        base64.b64decode(ciphertext_b64.encode("ascii")),
                        key,
                    ),
                    timeout=float(self.settings.request_timeout_seconds),
                )
                return base64.b64decode(plaintext_b64.encode("ascii"))
            except Exception:
                if not self.settings.allow_local_tee_fallback:
                    raise IntegrityError(
                        "TEE decryption failed and local fallback is disabled.",
                        status_code=502,
                        layer="L3",
                    )
        return await asyncio.to_thread(self._decrypt_local, ciphertext_b64, key)

    async def _run_remote_crypto(self, mode: str, payload: bytes, key: bytes) -> str:
        assert self._sandbox is not None
        code = """
import base64
from cryptography.fernet import Fernet

mode = envs["MODE"]
data = base64.b64decode(envs["PAYLOAD_B64"])
fernet = Fernet(envs["FERNET_KEY"].encode("utf-8"))
if mode == "encrypt":
    result = base64.b64encode(fernet.encrypt(data)).decode("ascii")
else:
    result = base64.b64encode(fernet.decrypt(data)).decode("ascii")
result
""".strip()
        execution = await self._sandbox.run_code(
            code,
            envs={
                "MODE": mode,
                "PAYLOAD_B64": base64.b64encode(payload).decode("ascii"),
                "FERNET_KEY": key.decode("ascii"),
            },
            timeout=float(self.settings.request_timeout_seconds),
            request_timeout=float(self.settings.request_timeout_seconds + 5),
        )
        return self._extract_execution_text(execution)

    @staticmethod
    def _extract_execution_text(execution: Any) -> str:
        for attr in ("text", "stdout", "stderr"):
            value = getattr(execution, attr, None)
            if isinstance(value, str) and value.strip():
                return value.strip()

        results = getattr(execution, "results", None)
        if isinstance(results, list) and results:
            first = results[0]
            for attr in ("text", "data"):
                value = getattr(first, attr, None)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        raise RuntimeError("E2B sandbox returned no usable result")

    @staticmethod
    def _encrypt_local(payload: bytes, key: bytes) -> str:
        ciphertext = Fernet(key).encrypt(payload)
        return base64.b64encode(ciphertext).decode("ascii")

    @staticmethod
    def _decrypt_local(ciphertext_b64: str, key: bytes) -> bytes:
        ciphertext = base64.b64decode(ciphertext_b64.encode("ascii"))
        return Fernet(key).decrypt(ciphertext)


class E2BClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def session(self) -> EphemeralSandbox:
        return EphemeralSandbox(self.settings)

    async def health(self) -> tuple[str, str]:
        if not self.settings.e2b_api_key:
            return ("degraded", "E2B API key is not configured; local TEE fallback is active.")
        return ("ok", "E2B API key is configured for per-request sandboxes.")
