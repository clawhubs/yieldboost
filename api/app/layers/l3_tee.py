from ..clients.e2b_client import EphemeralSandbox


async def run_encrypt(
    sandbox: EphemeralSandbox,
    payload: bytes,
    *,
    wallet_address: str,
    storage_id: str,
    payload_sha256: str,
) -> str:
    return await sandbox.encrypt(
        payload,
        wallet_address=wallet_address,
        storage_id=storage_id,
        payload_sha256=payload_sha256,
    )


async def run_decrypt(
    sandbox: EphemeralSandbox,
    ciphertext_b64: str,
    *,
    wallet_address: str,
    storage_id: str,
    payload_sha256: str,
) -> bytes:
    return await sandbox.decrypt(
        ciphertext_b64,
        wallet_address=wallet_address,
        storage_id=storage_id,
        payload_sha256=payload_sha256,
    )

