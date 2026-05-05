from ..clients.zero_g_chain import AnchorReceipt, ZeroGChainClient


async def run(
    client: ZeroGChainClient,
    *,
    network: str,
    cid: str,
    root_hash: str,
    storage_tx_hash: str,
) -> AnchorReceipt:
    return await client.anchor_integrity_proof(
        network=network,
        cid=cid,
        root_hash=root_hash,
        storage_tx_hash=storage_tx_hash,
    )
