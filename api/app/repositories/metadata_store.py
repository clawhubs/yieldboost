import asyncio
import json
from pathlib import Path
from typing import Any


class MetadataStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = asyncio.Lock()

    async def _read(self) -> dict[str, Any]:
        def read_sync() -> dict[str, Any]:
            if not self.path.exists():
                return {"vault_records": {}, "events": [], "handshakes": [], "auth_challenges": {}}
            return json.loads(self.path.read_text(encoding="utf-8"))

        return await asyncio.to_thread(read_sync)

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
