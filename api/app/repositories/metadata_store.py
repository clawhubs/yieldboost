import asyncio
import json
from pathlib import Path
from typing import Any


class MetadataStore:
    def __init__(self, path: Path, security_logs_database_url: str | None = None) -> None:
        self.path = path
        self.security_logs_database_url = security_logs_database_url
        self._lock = asyncio.Lock()

    async def _read(self) -> dict[str, Any]:
        def read_sync() -> dict[str, Any]:
            if not self.path.exists():
                return self._empty_payload()
            payload = json.loads(self.path.read_text(encoding="utf-8"))
            return {**self._empty_payload(), **payload}

        return await asyncio.to_thread(read_sync)

    @staticmethod
    def _empty_payload() -> dict[str, Any]:
        return {
            "vault_records": {},
            "events": [],
            "handshakes": [],
            "auth_challenges": {},
            "security_logs": [],
        }

    async def _write(self, payload: dict[str, Any]) -> None:
        def write_sync() -> None:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        await asyncio.to_thread(write_sync)

    async def save_vault_record(self, storage_id: str, record: dict[str, Any]) -> None:
        async with self._lock:
            payload = await self._read()
            payload.setdefault("vault_records", {})[storage_id] = record
            await self._write(payload)

    async def get_vault_record(self, storage_id: str) -> dict[str, Any] | None:
        async with self._lock:
            payload = await self._read()
            return payload.get("vault_records", {}).get(storage_id)

    async def list_vault_records(
        self,
        *,
        wallet_address: str,
        network: str | None = None,
    ) -> list[dict[str, Any]]:
        async with self._lock:
            payload = await self._read()
            records = []
            for record in payload.get("vault_records", {}).values():
                if record.get("wallet_address", "").lower() != wallet_address.lower():
                    continue
                if network and record.get("network") != network:
                    continue
                records.append(record)
            return sorted(records, key=lambda item: item.get("created_at", ""), reverse=True)

    async def patch_vault_record(self, storage_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        async with self._lock:
            payload = await self._read()
            record = payload.get("vault_records", {}).get(storage_id)
            if not record:
                return None
            record.update(updates)
            payload.setdefault("vault_records", {})[storage_id] = record
            await self._write(payload)
            return record

    async def delete_vault_record(self, storage_id: str) -> None:
        async with self._lock:
            payload = await self._read()
            payload.get("vault_records", {}).pop(storage_id, None)
            await self._write(payload)

    async def append_event(self, event: dict[str, Any]) -> None:
        async with self._lock:
            payload = await self._read()
            events = payload.setdefault("events", [])
            events.append(event)
            payload["events"] = events[-200:]
            await self._write(payload)

    async def append_security_log(self, log: dict[str, Any]) -> None:
        async with self._lock:
            payload = await self._read()
            security_logs = payload.setdefault("security_logs", [])
            security_logs.append(log)
            payload["security_logs"] = security_logs[-1000:]
            await self._write(payload)

        await self._append_security_log_postgres(log)

    async def list_security_logs(self, limit: int = 100) -> list[dict[str, Any]]:
        async with self._lock:
            payload = await self._read()
            logs = payload.get("security_logs", [])
            return list(reversed(logs[-limit:]))

    async def count_security_logs(
        self,
        *,
        action_type: str | None = None,
        status: str | None = None,
    ) -> int:
        async with self._lock:
            payload = await self._read()
            count = 0
            for log in payload.get("security_logs", []):
                if action_type and log.get("action_type") != action_type:
                    continue
                if status and log.get("status") != status:
                    continue
                count += 1
            return count

    async def aggregate_failed_unseal_attempts(self) -> list[dict[str, Any]]:
        async with self._lock:
            payload = await self._read()
            buckets: dict[str, dict[str, Any]] = {}
            for log in payload.get("security_logs", []):
                if log.get("action_type") != "Unseal" or log.get("status") != "Blocked":
                    continue
                wallet = log.get("wallet_address") or "unknown"
                bucket = buckets.setdefault(
                    wallet.lower(),
                    {
                        "wallet_address": wallet,
                        "blocked_unseal_attempts": 0,
                        "last_seen_at": None,
                    },
                )
                bucket["blocked_unseal_attempts"] += 1
                timestamp = log.get("timestamp")
                if timestamp and (not bucket["last_seen_at"] or timestamp > bucket["last_seen_at"]):
                    bucket["last_seen_at"] = timestamp
            return sorted(
                buckets.values(),
                key=lambda item: (item["blocked_unseal_attempts"], item.get("last_seen_at") or ""),
                reverse=True,
            )

    async def _append_security_log_postgres(self, log: dict[str, Any]) -> None:
        if not self.security_logs_database_url:
            return

        try:
            import asyncpg

            connection = await asyncpg.connect(self.security_logs_database_url)
            try:
                await connection.execute(
                    """
                    create table if not exists security_logs (
                      id bigserial primary key,
                      wallet_address text not null,
                      action_type text not null check (action_type in ('Seal', 'Unseal')),
                      status text not null check (status in ('Success', 'Blocked')),
                      layer_failed text,
                      payload_metadata jsonb not null default '{}'::jsonb,
                      timestamp timestamptz not null default now()
                    );
                    """
                )
                await connection.execute(
                    """
                    insert into security_logs (
                      wallet_address,
                      action_type,
                      status,
                      layer_failed,
                      payload_metadata,
                      timestamp
                    )
                    values ($1, $2, $3, $4, $5::jsonb, $6::timestamptz)
                    """,
                    log.get("wallet_address") or "unknown",
                    log.get("action_type"),
                    log.get("status"),
                    log.get("layer_failed"),
                    json.dumps(log.get("payload_metadata") or {}),
                    log.get("timestamp"),
                )
            finally:
                await connection.close()
        except Exception:
            return

    async def append_handshake(self, handshake: dict[str, Any]) -> None:
        async with self._lock:
            payload = await self._read()
            handshakes = payload.setdefault("handshakes", [])
            handshakes.append(handshake)
            payload["handshakes"] = handshakes[-200:]
            await self._write(payload)

    async def save_auth_challenge(self, challenge_id: str, challenge: dict[str, Any]) -> None:
        async with self._lock:
            payload = await self._read()
            payload.setdefault("auth_challenges", {})[challenge_id] = challenge
            await self._write(payload)

    async def get_auth_challenge(self, challenge_id: str) -> dict[str, Any] | None:
        async with self._lock:
            payload = await self._read()
            return payload.get("auth_challenges", {}).get(challenge_id)

    async def patch_auth_challenge(self, challenge_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        async with self._lock:
            payload = await self._read()
            challenge = payload.get("auth_challenges", {}).get(challenge_id)
            if not challenge:
                return None
            challenge.update(updates)
            payload.setdefault("auth_challenges", {})[challenge_id] = challenge
            await self._write(payload)
            return challenge

    async def prune_auth_challenges(self, threshold_iso: str) -> None:
        async with self._lock:
            payload = await self._read()
            challenges = payload.setdefault("auth_challenges", {})
            next_challenges = {}
            for challenge_id, challenge in challenges.items():
                expires_at = challenge.get("expires_at")
                if not expires_at or expires_at >= threshold_iso:
                    next_challenges[challenge_id] = challenge
            payload["auth_challenges"] = next_challenges
            await self._write(payload)

    async def count_recent_events(self, wallet_address: str, window_seconds: int) -> int:
        from datetime import datetime, timedelta, timezone

        async with self._lock:
            payload = await self._read()
            threshold = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
            count = 0
            for event in payload.get("events", []):
                if event.get("wallet_address", "").lower() != wallet_address.lower():
                    continue
                created_at = event.get("created_at")
                if not created_at:
                    continue
                try:
                    parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except ValueError:
                    continue
                if parsed >= threshold:
                    count += 1
            return count
