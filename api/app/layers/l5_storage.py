from ..clients.zero_g_storage import StorageReceipt, ZeroGStorageClient


async def run(
    client: ZeroGStorageClient,
    *,
    storage_id: str,
    network: str,
    payload: dict,
) -> StorageReceipt:
    return await client.store_sealed_blob(
        storage_id=storage_id,
        network=network,
        payload=payload,
    )
