from ..clients.zero_g_chain import AnchorReceipt, ZeroGChainClient
from ..core.exceptions import IntegrityError


async def run(
    client: ZeroGChainClient,
    *,
    network: str,
    cid: str,
    root_hash: str,
    storage_tx_hash: str,
) -> AnchorReceipt:
    try:
        return await client.anchor_integrity_proof(
            network=network,
            cid=cid,
            root_hash=root_hash,
            storage_tx_hash=storage_tx_hash,
        )
    except IntegrityError:
        raise
    except Exception as exc:
        raise IntegrityError(
            "0G proof anchor failed.",
            status_code=502,
            layer="L7",
            detail={"reason": str(exc)},
        ) from exc
