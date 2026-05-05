import asyncio
from dataclasses import dataclass

from ..core.config import Settings


PROOF_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "cid", "type": "string"},
            {"internalType": "bytes32", "name": "rootHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "storageTxHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "currentApyBps", "type": "uint256"},
            {"internalType": "uint256", "name": "optimizedApyBps", "type": "uint256"},
        ],
        "name": "recordProof",
        "outputs": [{"internalType": "uint256", "name": "proofId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


@dataclass
class AnchorReceipt:
    mode: str
    tx_hash: str
    explorer_url: str | None


class ZeroGChainClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def anchor_integrity_proof(
        self,
        *,
        network: str,
        cid: str,
        root_hash: str,
        storage_tx_hash: str,
        current_apy_bps: int = 0,
        optimized_apy_bps: int = 0,
    ) -> AnchorReceipt:
        network_config = self.settings.network_config(network)
        if not network_config.chain_enabled:
            return AnchorReceipt(
                mode="mock-anchor",
                tx_hash=f"mock-{root_hash[:24]}",
                explorer_url=None,
            )
        return await asyncio.to_thread(
            self._anchor_sync,
            network,
            cid,
            root_hash,
            storage_tx_hash,
            current_apy_bps,
            optimized_apy_bps,
        )

    def _anchor_sync(
        self,
        network: str,
        cid: str,
        root_hash: str,
        storage_tx_hash: str,
        current_apy_bps: int,
        optimized_apy_bps: int,
    ) -> AnchorReceipt:
        from eth_account import Account
        from web3 import Web3

        network_config = self.settings.network_config(network)
        assert network_config.private_key is not None
        assert network_config.rpc_url is not None
        assert network_config.proof_registry_address is not None

        web3 = Web3(Web3.HTTPProvider(network_config.rpc_url))
        account = Account.from_key(network_config.private_key)
        contract = web3.eth.contract(
            address=Web3.to_checksum_address(network_config.proof_registry_address),
            abi=PROOF_REGISTRY_ABI,
        )
        nonce = web3.eth.get_transaction_count(account.address)
        chain_id = web3.eth.chain_id
        tx = contract.functions.recordProof(
            cid,
            root_hash,
            storage_tx_hash,
            current_apy_bps,
            optimized_apy_bps,
        ).build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "chainId": chain_id,
                "gas": 350000,
                "gasPrice": web3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(tx)
        tx_hash = Web3.to_hex(web3.eth.send_raw_transaction(signed.raw_transaction))
        return AnchorReceipt(
            mode=f"0g-{network_config.key}",
            tx_hash=tx_hash,
            explorer_url=(
                f"{network_config.explorer_base_url.rstrip('/')}/tx/{tx_hash}"
            ),
        )

    async def health(self, network: str) -> tuple[str, str]:
        network_config = self.settings.network_config(network)
        if not network_config.chain_enabled:
            return ("degraded", f"0G {network_config.key} proof anchoring is not fully configured.")
        return ("ok", f"0G {network_config.key} proof anchoring is configured.")
