import asyncio
import json
from dataclasses import dataclass
from pathlib import Path

from ..core.config import Settings
from ..core.exceptions import IntegrityError


@dataclass
class StorageReceipt:
    storage_id: str
    storage_mode: str
    storage_uri: str
    root_hash: str | None = None
    tx_hash: str | None = None
    block_number: int | None = None
    explorer_url: str | None = None


class ZeroGStorageClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.script_path = Path(__file__).resolve().parents[2] / "scripts" / "zero_g_storage.mjs"

    async def store_sealed_blob(
        self,
        *,
        storage_id: str,
        network: str,
        payload: dict,
    ) -> StorageReceipt:
        network_config = self.settings.network_config(network)
        if (
            network_config.storage_enabled
            and network_config.storage_url
            and network_config.rpc_url
            and network_config.private_key
        ):
            result = await self._run_helper(
                {
                    "command": "upload-json",
                    "rpcUrl": network_config.rpc_url,
                    "storageUrls": [network_config.storage_url],
                    "privateKey": network_config.private_key,
                    "explorerBase": network_config.explorer_base_url,
                    "payload": payload,
                }
            )
            root_hash = str(result["rootHash"])
            tx_hash = str(result["txHash"])
            return StorageReceipt(
                storage_id=storage_id,
                storage_mode=f"0g-{network_config.key}",
                storage_uri=f"{network_config.storage_url.rstrip('/')}/v1/file/{root_hash}",
                root_hash=root_hash,
                tx_hash=tx_hash,
                block_number=int(result.get("blockNumber") or 0),
                explorer_url=result.get("explorerUrl"),
            )
        return StorageReceipt(
            storage_id=storage_id,
            storage_mode="local-fallback",
            storage_uri=f"local://{storage_id}",
        )

    async def read_sealed_blob(self, *, network: str, root_hash: str) -> dict:
        network_config = self.settings.network_config(network)
        if not network_config.storage_url:
            raise IntegrityError(
                f"0G Storage is not configured for {network}.",
                status_code=503,
                layer="L5",
            )
        result = await self._run_helper(
            {
                "command": "download-json",
                "storageUrl": network_config.storage_url,
                "rootHash": root_hash,
            }
        )
        if not isinstance(result, dict):
            raise IntegrityError("Downloaded storage payload is invalid.", status_code=502, layer="L5")
        return result

    async def health(self, network: str) -> tuple[str, str]:
        network_config = self.settings.network_config(network)
        if network_config.storage_enabled and network_config.rpc_url and network_config.private_key:
            return ("ok", f"0G Storage upload path is configured for {network_config.key}.")
        return (
            "degraded",
            f"0G Storage upload path is incomplete for {network_config.key}; local storage fallback is active.",
        )

    async def _run_helper(self, payload: dict) -> dict:
        process = await asyncio.create_subprocess_exec(
            "node",
            str(self.script_path),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await process.communicate(json.dumps(payload).encode("utf-8"))
        if process.returncode != 0:
            message = stderr.decode("utf-8", errors="ignore").strip() or "0G Storage helper failed."
            raise IntegrityError(message, status_code=502, layer="L5")
        try:
            return json.loads(stdout.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise IntegrityError("0G Storage helper returned invalid JSON.", status_code=502, layer="L5") from exc
