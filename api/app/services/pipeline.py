import asyncio
import base64
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from eth_account import Account
from eth_account.messages import encode_defunct

from ..clients.e2b_client import E2BClient
from ..clients.zero_g_chain import AnchorReceipt, ZeroGChainClient
from ..clients.zero_g_storage import StorageReceipt, ZeroGStorageClient
from ..core.challenge_message import build_challenge_message
from ..core.config import Settings
from ..core.exceptions import IntegrityError
from ..layers import (
    l1_blacklist,
    l2_auditor,
    l3_tee,
    l4_memory,
    l5_storage,
    l6_zk_reasoning,
    l7_anchor,
    l8_governance,
    l9_handshake,
)
from ..repositories.metadata_store import MetadataStore
from ..schemas.admin import ApiKeyUsageItem, DeveloperDashboardResponse, UsageSummaryItem
from ..schemas.auth import ChallengeRequest, ChallengeResponse
from ..schemas.health import ComponentHealth, HealthResponse
from ..schemas.platform import (
    AuditEvaluateRequest,
    AuditEvaluateResponse,
    BlacklistCheckResponse,
    GovernanceEvaluateRequest,
    GovernanceEvaluateResponse,
    HandshakeLogRequest,
    HandshakeLogResponse,
    LayerStatusResponse,
    ProofRunRequest,
    ProofRunResponse,
)
from ..schemas.vault import (
    AdminStatsResponse,
    AdminStatsWallet,
    DeleteRequest,
    DeleteResponse,
    SealRequest,
    SealResponse,
    SecurityLogItem,
    UnsealRequest,
    UnsealResponse,
    VaultListItem,
    VaultListResponse,
    VaultMetadataResponse,
)


@dataclass
class PipelineContext:
    operation: str
    network: str
    wallet_address: str
    storage_id: str
    mime_type: str
    file_name: str | None = None
    payload_bytes: bytes | None = None
    payload_sha256: str | None = None
    ciphertext_b64: str | None = None
    integrity_hash: str | None = None
    storage_receipt: StorageReceipt | None = None
    anchor_receipt: AnchorReceipt | None = None
    layer_statuses: dict[str, str] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


class IntegrityPipeline:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.store = MetadataStore(settings.store_path, settings.security_log_db_url)
        self.e2b = E2BClient(settings)
        self.zero_g_storage = ZeroGStorageClient(settings)
        self.zero_g_chain = ZeroGChainClient(settings)

    @staticmethod
    def now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    async def create_auth_challenge(
        self,
        payload: ChallengeRequest,
        request_id: str,
    ) -> ChallengeResponse:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=self.settings.auth_challenge_ttl_seconds)
        challenge_id = f"chl_{uuid4().hex}"
        network = payload.network or self.settings.default_network
        message = build_challenge_message(
            challenge_id=challenge_id,
            operation=payload.operation,
            network=network,
            wallet_address=payload.wallet_address,
            storage_id=payload.storage_id,
            issued_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
        )
        await self.store.prune_auth_challenges(now.isoformat())
        await self.store.save_auth_challenge(
            challenge_id,
            {
                "challenge_id": challenge_id,
                "operation": payload.operation,
                "network": network,
                "wallet_address": payload.wallet_address,
                "storage_id": payload.storage_id,
                "message": message,
                "issued_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "used_at": None,
            },
        )
        return ChallengeResponse(
            request_id=request_id,
            challenge_id=challenge_id,
            operation=payload.operation,
            network=network,
            wallet_address=payload.wallet_address,
            storage_id=payload.storage_id,
            message=message,
            issued_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
        )

    async def seal(self, payload: SealRequest, request_id: str) -> SealResponse:
        try:
            async with asyncio.timeout(self.settings.request_timeout_seconds):
                recent = await self.store.count_recent_events(payload.wallet_address, 60)
                await l8_governance.enforce_preflight(recent)
                challenge = await self._verify_auth_challenge(
                    challenge_id=payload.challenge_id,
                    operation="seal",
                    network=payload.network or self.settings.default_network,
                    wallet_address=payload.wallet_address,
                    storage_id=None,
                    message=payload.message,
                    typed_data=payload.typed_data,
                    signature_kind=payload.signature_kind,
                )
                await self._verify_signature(
                    wallet_address=payload.wallet_address,
                    signature=payload.signature,
                    signature_kind=payload.signature_kind,
                    message=(challenge or {}).get("message") or payload.message,
                    typed_data=payload.typed_data,
                )
                await self._consume_auth_challenge((challenge or {}).get("challenge_id", ""))

                storage_id = f"vault_{uuid4().hex}"
                payload_bytes = self._extract_payload(payload)
                metadata = dict(payload.metadata)
                if payload.transaction_hash:
                    metadata["transaction_hash"] = payload.transaction_hash
                ctx = PipelineContext(
                    operation="seal",
                    network=payload.network or self.settings.default_network,
                    wallet_address=payload.wallet_address,
                    storage_id=storage_id,
                    mime_type=payload.mime_type,
                    file_name=payload.file_name,
                    payload_bytes=payload_bytes,
                    metadata=metadata,
                )

                # Vault payloads are allowed to be secrets; L1 screens request intent, not stored bytes.
                await l1_blacklist.run(f"vault seal request {ctx.network}")
                ctx.layer_statuses["L1"] = "passed"

                ctx.payload_sha256 = await l2_auditor.run(
                    payload_bytes,
                    max_payload_bytes=self.settings.max_payload_bytes,
                )
                ctx.layer_statuses["L2"] = "passed"

                async with self.e2b.session() as sandbox:
                    ctx.ciphertext_b64 = await l3_tee.run_encrypt(
                        sandbox,
                        payload_bytes,
                        wallet_address=ctx.wallet_address,
                        storage_id=ctx.storage_id,
                        payload_sha256=ctx.payload_sha256,
                    )
                    ctx.layer_statuses["L3"] = f"sealed:{sandbox.backend}"

                    memory_record = await l4_memory.run(ctx.storage_id, ctx.wallet_address)
                    ctx.layer_statuses["L4"] = memory_record["status"]

                    storage_payload = {
                        "version": 1,
                        "vault_id": ctx.storage_id,
                        "network": ctx.network,
                        "wallet_address": ctx.wallet_address,
                        "mime_type": ctx.mime_type,
                        "file_name": ctx.file_name,
                        "payload_sha256": ctx.payload_sha256,
                        "ciphertext_b64": ctx.ciphertext_b64,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "metadata": ctx.metadata,
                    }
                    ctx.storage_receipt = await l5_storage.run(
                        self.zero_g_storage,
                        storage_id=ctx.storage_id,
                        network=ctx.network,
                        payload=storage_payload,
                    )
                    ctx.layer_statuses["L5"] = ctx.storage_receipt.storage_mode

                    ctx.integrity_hash, zk_envelope = await l6_zk_reasoning.run(
                        {
                            "wallet_address": ctx.wallet_address,
                            "storage_id": ctx.storage_id,
                            "storage_root_hash": ctx.storage_receipt.root_hash,
                            "storage_tx_hash": ctx.storage_receipt.tx_hash,
                            "payload_sha256": ctx.payload_sha256,
                            "ciphertext_sha256": hashlib.sha256(
                                ctx.ciphertext_b64.encode("utf-8")
                            ).hexdigest(),
                            "storage_uri": ctx.storage_receipt.storage_uri,
                            "metadata": ctx.metadata,
                        }
                    )
                    ctx.layer_statuses["L6"] = zk_envelope["proof_type"]

                    ctx.anchor_receipt = await l7_anchor.run(
                        self.zero_g_chain,
                        network=ctx.network,
                        cid=ctx.storage_receipt.root_hash or ctx.storage_id,
                        root_hash=ctx.storage_receipt.root_hash or f"0x{ctx.integrity_hash}",
                        storage_tx_hash=ctx.storage_receipt.tx_hash or f"0x{ctx.integrity_hash}",
                    )
                    ctx.layer_statuses["L7"] = ctx.anchor_receipt.mode

                    governance = await l8_governance.run()
                    ctx.layer_statuses["L8"] = str(governance["status"])

                    handshake = await l9_handshake.run(
                        ctx.storage_id,
                        ctx.wallet_address,
                        ctx.operation,
                    )
                    ctx.layer_statuses["L9"] = handshake["status"]

                await self.store.save_vault_record(
                    ctx.storage_id,
                    {
                        "storage_id": ctx.storage_id,
                        "network": ctx.network,
                        "wallet_address": ctx.wallet_address,
                        "payload_sha256": ctx.payload_sha256,
                        "integrity_hash": ctx.integrity_hash,
                        "ciphertext_b64": ctx.ciphertext_b64,
                        "file_name": ctx.file_name,
                        "mime_type": ctx.mime_type,
                        "storage_uri": ctx.storage_receipt.storage_uri if ctx.storage_receipt else None,
                        "storage_mode": ctx.storage_receipt.storage_mode if ctx.storage_receipt else None,
                        "storage_root_hash": ctx.storage_receipt.root_hash if ctx.storage_receipt else None,
                        "storage_tx_hash": ctx.storage_receipt.tx_hash if ctx.storage_receipt else None,
                        "storage_explorer_url": ctx.storage_receipt.explorer_url if ctx.storage_receipt else None,
                        "anchor_tx_hash": ctx.anchor_receipt.tx_hash if ctx.anchor_receipt else None,
                        "anchor_explorer_url": ctx.anchor_receipt.explorer_url if ctx.anchor_receipt else None,
                        "anchor_mode": ctx.anchor_receipt.mode if ctx.anchor_receipt else None,
                        "transaction_hash": payload.transaction_hash,
                        "metadata": ctx.metadata,
                        "layer_statuses": ctx.layer_statuses,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
                await self.store.append_event(
                    {
                        "type": "seal",
                        "wallet_address": ctx.wallet_address,
                        "storage_id": ctx.storage_id,
                        "created_at": self.now_iso(),
                    }
                )
                await self.store.append_handshake(
                    {
                        "wallet_address": ctx.wallet_address,
                        "storage_id": ctx.storage_id,
                        "operation": ctx.operation,
                        "created_at": self.now_iso(),
                    }
                )
                await self._append_security_log(
                    wallet_address=ctx.wallet_address,
                    action_type="Seal",
                    status="Success",
                    payload_metadata={
                        "storage_id": ctx.storage_id,
                        "network": ctx.network,
                        "file_name": ctx.file_name,
                        "mime_type": ctx.mime_type,
                        "transaction_hash": payload.transaction_hash,
                    },
                )

                return SealResponse(
                    request_id=request_id,
                    network=ctx.network,
                    storage_id=ctx.storage_id,
                    storage_root_hash=ctx.storage_receipt.root_hash if ctx.storage_receipt else None,
                    storage_tx_hash=ctx.storage_receipt.tx_hash if ctx.storage_receipt else None,
                    storage_explorer_url=ctx.storage_receipt.explorer_url if ctx.storage_receipt else None,
                    integrity_hash=ctx.integrity_hash or "",
                    judge_url=f"{self.settings.judge_base_url}?storage_id={ctx.storage_id}",
                    anchor_tx_hash=ctx.anchor_receipt.tx_hash if ctx.anchor_receipt else None,
                    anchor_explorer_url=ctx.anchor_receipt.explorer_url if ctx.anchor_receipt else None,
                    layer_statuses=ctx.layer_statuses,
                )
        except TimeoutError as exc:
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Seal",
                status="Blocked",
                layer_failed="L9",
                payload_metadata={
                    "network": payload.network or self.settings.default_network,
                    "file_name": payload.file_name,
                    "mime_type": payload.mime_type,
                    "reason": "timeout",
                },
            )
            raise IntegrityError(
                "Seal operation exceeded the request timeout window.",
                status_code=504,
                layer="pipeline",
            ) from exc
        except Exception as exc:
            if "ctx" in locals():
                await self.store.delete_vault_record(ctx.storage_id)
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Seal",
                status="Blocked",
                layer_failed=self._layer_from_exception(exc),
                payload_metadata={
                    "network": payload.network or self.settings.default_network,
                    "file_name": payload.file_name,
                    "mime_type": payload.mime_type,
                    "reason": str(exc),
                },
            )
            raise

    async def unseal(self, payload: UnsealRequest, request_id: str) -> UnsealResponse:
        try:
            async with asyncio.timeout(self.settings.request_timeout_seconds):
                requested_network = payload.network or self.settings.default_network
                challenge = await self._verify_auth_challenge(
                    challenge_id=payload.challenge_id,
                    operation="unseal",
                    network=requested_network,
                    wallet_address=payload.wallet_address,
                    storage_id=payload.storage_id,
                    message=payload.message,
                    typed_data=payload.typed_data,
                    signature_kind=payload.signature_kind,
                )
                await self._verify_signature(
                    wallet_address=payload.wallet_address,
                    signature=payload.signature,
                    signature_kind=payload.signature_kind,
                    message=(challenge or {}).get("message") or payload.message,
                    typed_data=payload.typed_data,
                )
                await self._consume_auth_challenge((challenge or {}).get("challenge_id", ""))

                record = await self.store.get_vault_record(payload.storage_id)
                if not record:
                    raise IntegrityError("Storage record was not found.", status_code=404)
                if record["wallet_address"].lower() != payload.wallet_address.lower():
                    raise IntegrityError(
                        "Only the sealing wallet can unseal this vault.",
                        status_code=403,
                        layer="ownership",
                    )
                if payload.network and record.get("network") and payload.network != record["network"]:
                    raise IntegrityError(
                        "Requested network does not match the vault record network.",
                        status_code=409,
                        layer="network",
                    )

                ctx = PipelineContext(
                    operation="unseal",
                    network=record.get("network", payload.network or self.settings.default_network),
                    wallet_address=payload.wallet_address,
                    storage_id=payload.storage_id,
                    mime_type=record.get("mime_type", "application/octet-stream"),
                    file_name=record.get("file_name"),
                    payload_sha256=record.get("payload_sha256"),
                    integrity_hash=record.get("integrity_hash"),
                )

                await l1_blacklist.run(payload.message or payload.storage_id)
                ctx.layer_statuses["L1"] = "passed"
                ctx.layer_statuses["L2"] = "ownership-verified"

                encrypted_payload = None
                if record.get("storage_root_hash") and record.get("storage_mode", "").startswith("0g-"):
                    encrypted_payload = await self.zero_g_storage.read_sealed_blob(
                        network=ctx.network,
                        root_hash=record["storage_root_hash"],
                    )

                ciphertext_b64 = (
                    encrypted_payload.get("ciphertext_b64")
                    if isinstance(encrypted_payload, dict)
                    else None
                ) or record["ciphertext_b64"]

                async with self.e2b.session() as sandbox:
                    plaintext = await l3_tee.run_decrypt(
                        sandbox,
                        ciphertext_b64,
                        wallet_address=ctx.wallet_address,
                        storage_id=ctx.storage_id,
                        payload_sha256=ctx.payload_sha256 or "",
                    )
                    ctx.layer_statuses["L3"] = f"unsealed:{sandbox.backend}"
                    ctx.payload_bytes = plaintext

                await self.store.append_event(
                    {
                        "type": "unseal",
                        "wallet_address": ctx.wallet_address,
                        "storage_id": ctx.storage_id,
                        "created_at": self.now_iso(),
                    }
                )
                await self.store.patch_vault_record(
                    ctx.storage_id,
                    {
                        "last_unsealed_at": self.now_iso(),
                    },
                )
                ctx.layer_statuses["L4"] = "memory-read"
                ctx.layer_statuses["L5"] = record.get("storage_mode", "local-fallback")
                ctx.layer_statuses["L6"] = "integrity-hash-verified"
                ctx.layer_statuses["L7"] = record.get("anchor_mode", "mock-anchor")
                ctx.layer_statuses["L8"] = "active"
                ctx.layer_statuses["L9"] = "completed"
                await self._append_security_log(
                    wallet_address=ctx.wallet_address,
                    action_type="Unseal",
                    status="Success",
                    payload_metadata={
                        "storage_id": ctx.storage_id,
                        "network": ctx.network,
                        "file_name": ctx.file_name,
                        "mime_type": ctx.mime_type,
                    },
                )

                plaintext_value = None
                file_content_base64 = None
                if ctx.mime_type.startswith("text/"):
                    plaintext_value = plaintext.decode("utf-8")
                else:
                    file_content_base64 = base64.b64encode(plaintext).decode("ascii")

                return UnsealResponse(
                    request_id=request_id,
                    network=ctx.network,
                    storage_id=ctx.storage_id,
                    integrity_hash=ctx.integrity_hash or "",
                    plaintext=plaintext_value,
                    file_name=ctx.file_name,
                    file_content_base64=file_content_base64,
                    mime_type=ctx.mime_type,
                    layer_statuses=ctx.layer_statuses,
                )
        except TimeoutError as exc:
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Unseal",
                status="Blocked",
                layer_failed="L9",
                payload_metadata={
                    "storage_id": payload.storage_id,
                    "network": payload.network or self.settings.default_network,
                    "reason": "timeout",
                },
            )
            raise IntegrityError(
                "Unseal operation exceeded the request timeout window.",
                status_code=504,
                layer="pipeline",
            ) from exc
        except Exception as exc:
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Unseal",
                status="Blocked",
                layer_failed=self._layer_from_exception(exc),
                payload_metadata={
                    "storage_id": payload.storage_id,
                    "network": payload.network or self.settings.default_network,
                    "reason": str(exc),
                },
            )
            raise

    async def delete(self, payload: DeleteRequest, request_id: str) -> DeleteResponse:
        try:
            async with asyncio.timeout(self.settings.request_timeout_seconds):
                requested_network = payload.network or self.settings.default_network
                challenge = await self._verify_auth_challenge(
                    challenge_id=payload.challenge_id,
                    operation="delete",
                    network=requested_network,
                    wallet_address=payload.wallet_address,
                    storage_id=payload.storage_id,
                    message=payload.message,
                    typed_data=payload.typed_data,
                    signature_kind=payload.signature_kind,
                )
                await self._verify_signature(
                    wallet_address=payload.wallet_address,
                    signature=payload.signature,
                    signature_kind=payload.signature_kind,
                    message=(challenge or {}).get("message") or payload.message,
                    typed_data=payload.typed_data,
                )
                await self._consume_auth_challenge((challenge or {}).get("challenge_id", ""))

                record = await self.store.get_vault_record(payload.storage_id)
                if not record:
                    raise IntegrityError("Storage record was not found.", status_code=404)
                if record["wallet_address"].lower() != payload.wallet_address.lower():
                    raise IntegrityError(
                        "Only the sealing wallet can delete this vault.",
                        status_code=403,
                        layer="ownership",
                    )
                if payload.network and record.get("network") and payload.network != record["network"]:
                    raise IntegrityError(
                        "Requested network does not match the vault record network.",
                        status_code=409,
                        layer="network",
                    )

                ctx = PipelineContext(
                    operation="delete",
                    network=record.get("network", requested_network),
                    wallet_address=payload.wallet_address,
                    storage_id=payload.storage_id,
                    mime_type=record.get("mime_type", "application/octet-stream"),
                    file_name=record.get("file_name"),
                    payload_sha256=record.get("payload_sha256"),
                    integrity_hash=record.get("integrity_hash"),
                )

                await l1_blacklist.run(payload.message or payload.storage_id)
                ctx.layer_statuses["L1"] = "passed"
                ctx.layer_statuses["L2"] = "ownership-verified"
                ctx.layer_statuses["L3"] = "delete-signed"
                ctx.layer_statuses["L4"] = "memory-delete"
                ctx.layer_statuses["L5"] = "record-index-removed"
                ctx.layer_statuses["L6"] = "integrity-tombstone"
                ctx.layer_statuses["L7"] = record.get("anchor_mode", "immutable-storage-retained")
                ctx.layer_statuses["L8"] = "active"
                ctx.layer_statuses["L9"] = "completed"

                await self.store.delete_vault_record(ctx.storage_id)
                await self.store.append_event(
                    {
                        "type": "delete",
                        "wallet_address": ctx.wallet_address,
                        "storage_id": ctx.storage_id,
                        "created_at": self.now_iso(),
                    }
                )
                await self._append_security_log(
                    wallet_address=ctx.wallet_address,
                    action_type="Delete",
                    status="Success",
                    payload_metadata={
                        "storage_id": ctx.storage_id,
                        "network": ctx.network,
                        "file_name": ctx.file_name,
                        "mime_type": ctx.mime_type,
                        "storage_mode": record.get("storage_mode"),
                        "anchor_mode": record.get("anchor_mode"),
                    },
                )

                return DeleteResponse(
                    request_id=request_id,
                    network=ctx.network,
                    storage_id=ctx.storage_id,
                    deleted=True,
                    storage_mode=record.get("storage_mode"),
                    anchor_mode=record.get("anchor_mode"),
                    layer_statuses=ctx.layer_statuses,
                )
        except TimeoutError as exc:
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Delete",
                status="Blocked",
                layer_failed="L9",
                payload_metadata={
                    "storage_id": payload.storage_id,
                    "network": payload.network or self.settings.default_network,
                    "reason": "timeout",
                },
            )
            raise IntegrityError(
                "Delete operation exceeded the request timeout window.",
                status_code=504,
                layer="pipeline",
            ) from exc
        except Exception as exc:
            await self._append_security_log(
                wallet_address=payload.wallet_address,
                action_type="Delete",
                status="Blocked",
                layer_failed=self._layer_from_exception(exc),
                payload_metadata={
                    "storage_id": payload.storage_id,
                    "network": payload.network or self.settings.default_network,
                    "reason": str(exc),
                },
            )
            raise

    async def get_metadata(self, storage_id: str, request_id: str) -> VaultMetadataResponse:
        record = await self.store.get_vault_record(storage_id)
        if not record:
            raise IntegrityError("Storage record was not found.", status_code=404)
        return VaultMetadataResponse(
            request_id=request_id,
            network=record.get("network", self.settings.default_network),
            storage_id=record["storage_id"],
            storage_root_hash=record.get("storage_root_hash"),
            storage_tx_hash=record.get("storage_tx_hash"),
            storage_explorer_url=record.get("storage_explorer_url"),
            wallet_address=record["wallet_address"],
            integrity_hash=record["integrity_hash"],
            payload_sha256=record["payload_sha256"],
            mime_type=record["mime_type"],
            file_name=record.get("file_name"),
            storage_uri=record.get("storage_uri"),
            storage_mode=record.get("storage_mode"),
            anchor_tx_hash=record.get("anchor_tx_hash"),
            anchor_explorer_url=record.get("anchor_explorer_url"),
            anchor_mode=record.get("anchor_mode"),
            created_at=record["created_at"],
            metadata=record.get("metadata", {}),
            last_unsealed_at=record.get("last_unsealed_at"),
        )

    async def list_vaults(
        self,
        *,
        wallet_address: str,
        request_id: str,
        network: str | None = None,
    ) -> VaultListResponse:
        records = await self.store.list_vault_records(
            wallet_address=wallet_address,
            network=network,
        )
        items = [
            VaultListItem(
                storage_id=record["storage_id"],
                network=record.get("network", self.settings.default_network),
                wallet_address=record["wallet_address"],
                integrity_hash=record["integrity_hash"],
                payload_sha256=record["payload_sha256"],
                mime_type=record["mime_type"],
                file_name=record.get("file_name"),
                storage_root_hash=record.get("storage_root_hash"),
                storage_tx_hash=record.get("storage_tx_hash"),
                storage_explorer_url=record.get("storage_explorer_url"),
                anchor_tx_hash=record.get("anchor_tx_hash"),
                anchor_explorer_url=record.get("anchor_explorer_url"),
                created_at=record["created_at"],
                last_unsealed_at=record.get("last_unsealed_at"),
                layer_statuses=record.get("layer_statuses", {}),
                metadata=record.get("metadata", {}),
            )
            for record in records
        ]
        return VaultListResponse(
            request_id=request_id,
            network=network,
            wallet_address=wallet_address,
            items=items,
            total=len(items),
        )

    async def admin_stats(self, request_id: str) -> AdminStatsResponse:
        failed_wallets = await self.store.aggregate_failed_unseal_attempts()
        recent_logs = await self.store.list_security_logs(limit=50)
        total_deflected_attacks = await self.store.count_security_logs(status="Blocked")
        return AdminStatsResponse(
            request_id=request_id,
            total_deflected_attacks=total_deflected_attacks,
            failed_unseal_attempts=[
                AdminStatsWallet(
                    wallet_address=item["wallet_address"],
                    blocked_unseal_attempts=item["blocked_unseal_attempts"],
                    last_seen_at=item.get("last_seen_at"),
                )
                for item in failed_wallets
            ],
            recent_logs=[
                SecurityLogItem(
                    wallet_address=log.get("wallet_address") or "unknown",
                    action_type=log.get("action_type", "Unseal"),
                    status=log.get("status", "Blocked"),
                    layer_failed=log.get("layer_failed"),
                    payload_metadata=log.get("payload_metadata") or {},
                    timestamp=log.get("timestamp"),
                )
                for log in recent_logs
            ],
        )

    async def developer_dashboard(self, request_id: str) -> DeveloperDashboardResponse:
        api_keys = await self.store.list_api_keys(include_revoked=True)
        usage_summary = await self.store.summarize_api_usage()
        recent_usage = await self.store.list_api_usage(limit=50)
        recent_logs = await self.store.list_security_logs(limit=50)
        total_deflected_attacks = await self.store.count_security_logs(status="Blocked")

        total_requests = sum(int(item.get("total_requests") or 0) for item in api_keys)
        success_requests = sum(int(item.get("success_requests") or 0) for item in api_keys)
        blocked_requests = sum(int(item.get("blocked_requests") or 0) for item in api_keys)
        active_api_keys = sum(1 for item in api_keys if item.get("status") != "revoked")
        revoked_api_keys = len(api_keys) - active_api_keys

        return DeveloperDashboardResponse(
            request_id=request_id,
            total_api_keys=len(api_keys),
            active_api_keys=active_api_keys,
            revoked_api_keys=revoked_api_keys,
            total_requests=total_requests,
            success_requests=success_requests,
            blocked_requests=blocked_requests,
            total_deflected_attacks=total_deflected_attacks,
            top_apps=[
                UsageSummaryItem(
                    key_id=item.get("key_id"),
                    app_name=item.get("app_name", "Unknown App"),
                    total_requests=int(item.get("total_requests") or 0),
                    success_requests=int(item.get("success_requests") or 0),
                    blocked_requests=int(item.get("blocked_requests") or 0),
                    last_used_at=item.get("last_used_at"),
                )
                for item in usage_summary[:8]
            ],
            recent_usage=[
                ApiKeyUsageItem(
                    request_id=item.get("request_id", ""),
                    path=item.get("path", "/"),
                    method=item.get("method", "GET"),
                    status_code=int(item.get("status_code") or 200),
                    category=item.get("category", "other"),
                    app_name=item.get("app_name", "Unknown App"),
                    key_id=item.get("key_id"),
                    network=item.get("network"),
                    wallet_address=item.get("wallet_address"),
                    latency_ms=int(item.get("latency_ms") or 0),
                    timestamp=item.get("timestamp", self.now_iso()),
                )
                for item in recent_usage
            ],
            recent_logs=[
                SecurityLogItem(
                    wallet_address=log.get("wallet_address") or "unknown",
                    action_type=log.get("action_type", "Unseal"),
                    status=log.get("status", "Blocked"),
                    layer_failed=log.get("layer_failed"),
                    payload_metadata=log.get("payload_metadata") or {},
                    timestamp=log.get("timestamp"),
                )
                for log in recent_logs
            ],
        )

    async def health(self, request_id: str) -> HealthResponse:
        active_network = self.settings.default_network
        storage_status, storage_detail = await self.zero_g_storage.health(active_network)
        chain_status, chain_detail = await self.zero_g_chain.health(active_network)
        e2b_status, e2b_detail = await self.e2b.health()

        infrastructure = {
            "e2b": ComponentHealth(status=e2b_status, detail=e2b_detail),
            "0g_storage": ComponentHealth(status=storage_status, detail=storage_detail),
            f"0g_{active_network}": ComponentHealth(status=chain_status, detail=chain_detail),
            "metadata_store": ComponentHealth(
                status="ok",
                detail=f"Local metadata store at {self.settings.store_path}.",
            ),
        }
        layers = {
            "L1": ComponentHealth(status="ok", detail="Blacklist rules loaded."),
            "L2": ComponentHealth(status="ok", detail="Deterministic auditor ready."),
            "L3": ComponentHealth(status=e2b_status, detail=e2b_detail),
            "L4": ComponentHealth(status="ok", detail="Sovereign memory store ready."),
            "L5": ComponentHealth(status=storage_status, detail=storage_detail),
            "L6": ComponentHealth(status="ok", detail="Integrity hash envelope ready."),
            "L7": ComponentHealth(status=chain_status, detail=chain_detail),
            "L8": ComponentHealth(status="ok", detail="Safety throttling enabled."),
            "L9": ComponentHealth(status="ok", detail="Neural handshake journal ready."),
        }

        statuses = [item.status for item in infrastructure.values()]
        overall = "ok" if all(status == "ok" for status in statuses) else "degraded"
        if any(status == "down" for status in statuses):
            overall = "down"
        return HealthResponse(
            request_id=request_id,
            active_network=active_network,
            status=overall,
            infrastructure=infrastructure,
            layers=layers,
        )

    async def blacklist_check(self, text: str, request_id: str) -> BlacklistCheckResponse:
        await l1_blacklist.run(text)
        return BlacklistCheckResponse(
            request_id=request_id,
            allowed=True,
            layer_statuses={"L1": "passed"},
        )

    async def audit_evaluate(
        self,
        payload: AuditEvaluateRequest,
        request_id: str,
    ) -> AuditEvaluateResponse:
        payload_bytes = self._extract_audit_payload(payload)
        await l1_blacklist.run(self._payload_text_for_blacklist(payload_bytes))
        payload_sha256 = await l2_auditor.run(
            payload_bytes,
            max_payload_bytes=self.settings.max_payload_bytes,
        )
        return AuditEvaluateResponse(
            request_id=request_id,
            payload_sha256=payload_sha256,
            payload_size_bytes=len(payload_bytes),
            mime_type=payload.mime_type,
            layer_statuses={
                "L1": "passed",
                "L2": "passed",
            },
        )

    async def proof_run(self, payload: ProofRunRequest, request_id: str) -> ProofRunResponse:
        integrity_hash, envelope = await l6_zk_reasoning.run(payload.commitment)
        verified = payload.integrity_hash in {None, "", integrity_hash}
        return ProofRunResponse(
            request_id=request_id,
            integrity_hash=integrity_hash,
            verified=verified,
            proof_type=str(envelope.get("proof_type", "zk-ready-integrity-envelope")),
            envelope=envelope,
            layer_statuses={"L6": str(envelope.get("proof_type", "zk-ready-integrity-envelope"))},
        )

    async def governance_evaluate(
        self,
        payload: GovernanceEvaluateRequest,
        request_id: str,
    ) -> GovernanceEvaluateResponse:
        await l8_governance.enforce_preflight(payload.recent_request_count)
        result = await l8_governance.run()
        return GovernanceEvaluateResponse(
            request_id=request_id,
            allowed=True,
            risk_score=int(result.get("risk_score", 0)),
            status=str(result.get("status", "active")),
            layer_statuses={"L8": str(result.get("status", "active"))},
        )

    async def handshake_log(
        self,
        payload: HandshakeLogRequest,
        request_id: str,
    ) -> HandshakeLogResponse:
        wallet_address = payload.wallet_address or "0x0000000000000000000000000000000000000000"
        result = await l9_handshake.run(payload.subject_id, wallet_address, payload.operation)
        await self.store.append_handshake(
            {
                "subject_id": payload.subject_id,
                "wallet_address": payload.wallet_address,
                "operation": payload.operation,
                "metadata": payload.metadata,
                "created_at": result["timestamp"],
            }
        )
        return HandshakeLogResponse(
            request_id=request_id,
            subject_id=payload.subject_id,
            operation=payload.operation,
            status=result["status"],
            timestamp=result["timestamp"],
            layer_statuses={"L9": result["status"]},
        )

    async def layer_status(self, request_id: str) -> LayerStatusResponse:
        health = await self.health(request_id)
        return LayerStatusResponse(
            request_id=request_id,
            active_network=health.active_network,
            layers=health.layers,
            infrastructure=health.infrastructure,
        )

    def _extract_payload(self, payload: SealRequest) -> bytes:
        if payload.plaintext is not None:
            return payload.plaintext.encode("utf-8")
        assert payload.file_content_base64 is not None
        return base64.b64decode(payload.file_content_base64.encode("ascii"))

    def _extract_audit_payload(self, payload: AuditEvaluateRequest) -> bytes:
        if payload.plaintext is not None:
            return payload.plaintext.encode("utf-8")
        assert payload.file_content_base64 is not None
        return base64.b64decode(payload.file_content_base64.encode("ascii"))

    async def _append_security_log(
        self,
        *,
        wallet_address: str,
        action_type: str,
        status: str,
        payload_metadata: dict[str, Any],
        layer_failed: str | None = None,
    ) -> None:
        await self.store.append_security_log(
            {
                "wallet_address": wallet_address,
                "action_type": action_type,
                "status": status,
                "layer_failed": layer_failed,
                "payload_metadata": payload_metadata,
                "timestamp": self.now_iso(),
            }
        )

    @staticmethod
    def _layer_from_exception(exc: Exception) -> str:
        layer = exc.layer if isinstance(exc, IntegrityError) else None
        if layer and layer.startswith("L"):
            return layer
        if layer in {"auth", "ownership", "network"}:
            return "L2"
        if layer == "pipeline":
            return "L9"
        return "L9"

    @staticmethod
    def _payload_text_for_blacklist(payload: bytes) -> str:
        try:
            return payload.decode("utf-8")
        except UnicodeDecodeError:
            return ""

    @staticmethod
    def _normalize_auth_message(value: str | None) -> str | None:
        if value is None:
            return None
        return value.replace("\r\n", "\n").replace("\r", "\n")

    async def _verify_signature(
        self,
        *,
        wallet_address: str,
        signature: str,
        signature_kind: str,
        message: str | None,
        typed_data: dict[str, Any] | None,
    ) -> None:
        recovered = ""
        if signature_kind == "eip191":
            assert message is not None
            recovered = Account.recover_message(
                encode_defunct(text=message),
                signature=signature,
            )
        else:
            assert typed_data is not None
            recovered = await self._recover_typed_data(signature, typed_data)

        if recovered.lower() != wallet_address.lower():
            raise IntegrityError("Wallet signature verification failed.", status_code=401)

    async def _verify_auth_challenge(
        self,
        *,
        challenge_id: str | None,
        operation: str,
        network: str,
        wallet_address: str,
        storage_id: str | None,
        message: str | None,
        typed_data: dict[str, Any] | None,
        signature_kind: str,
    ) -> dict[str, Any] | None:
        if not self.settings.require_auth_challenge:
            return None
        if not challenge_id:
            raise IntegrityError("challenge_id is required.", status_code=400, layer="auth")
        challenge = await self.store.get_auth_challenge(challenge_id)
        if not challenge:
            raise IntegrityError("Auth challenge was not found.", status_code=404, layer="auth")
        if challenge.get("used_at"):
            raise IntegrityError("Auth challenge has already been used.", status_code=409, layer="auth")
        expires_at = challenge.get("expires_at")
        if not expires_at:
            raise IntegrityError("Auth challenge is invalid.", status_code=400, layer="auth")
        now = datetime.now(timezone.utc)
        try:
            expires = datetime.fromisoformat(expires_at)
        except ValueError as exc:
            raise IntegrityError("Auth challenge expiry is invalid.", status_code=400, layer="auth") from exc
        if expires <= now:
            raise IntegrityError("Auth challenge has expired.", status_code=410, layer="auth")
        if challenge.get("operation") != operation:
            raise IntegrityError("Auth challenge operation mismatch.", status_code=409, layer="auth")
        if challenge.get("network") != network:
            raise IntegrityError("Auth challenge network mismatch.", status_code=409, layer="auth")
        if challenge.get("wallet_address", "").lower() != wallet_address.lower():
            raise IntegrityError("Auth challenge wallet mismatch.", status_code=409, layer="auth")
        if (challenge.get("storage_id") or storage_id) and challenge.get("storage_id") != storage_id:
            raise IntegrityError("Auth challenge storage mismatch.", status_code=409, layer="auth")
        expected_message = self._normalize_auth_message(challenge.get("message"))
        provided_message = self._normalize_auth_message(message)
        if signature_kind == "eip191" and (not provided_message or provided_message != expected_message):
            raise IntegrityError("Signed message does not match the auth challenge.", status_code=409, layer="auth")
        if signature_kind == "eip712" and not self._typed_data_matches_challenge(
            typed_data,
            expected_message=challenge.get("message"),
            challenge_id=challenge_id,
            operation=operation,
            network=network,
            wallet_address=wallet_address,
            storage_id=storage_id,
        ):
            raise IntegrityError("Signed typed data does not match the auth challenge.", status_code=409, layer="auth")
        return challenge

    async def _consume_auth_challenge(self, challenge_id: str) -> None:
        if not challenge_id:
            return
        await self.store.patch_auth_challenge(
            challenge_id,
            {
                "used_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    async def _recover_typed_data(self, signature: str, typed_data: dict[str, Any]) -> str:
        from eth_account.messages import encode_typed_data

        try:
            signable = encode_typed_data(full_message=typed_data)
        except TypeError:
            signable = encode_typed_data(typed_data)
        return Account.recover_message(signable, signature=signature)

    @staticmethod
    def _typed_data_matches_challenge(
        typed_data: dict[str, Any] | None,
        *,
        expected_message: str,
        challenge_id: str,
        operation: str,
        network: str,
        wallet_address: str,
        storage_id: str | None,
    ) -> bool:
        if not typed_data:
            return False
        message = typed_data.get("message")
        if not isinstance(message, dict):
            return False
        return (
            message.get("challenge") == expected_message
            and message.get("challengeId") == challenge_id
            and message.get("operation") == operation
            and message.get("network") == network
            and str(message.get("wallet", "")).lower() == wallet_address.lower()
            and (message.get("storageId") or None) == storage_id
        )
