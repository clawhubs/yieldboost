import hashlib
import json
from datetime import datetime, timezone
from typing import Any


async def run(commitment: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    envelope = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "commitment": commitment,
        "proof_type": "zk-ready-integrity-envelope",
    }
    encoded = json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode("utf-8")
    integrity_hash = hashlib.sha256(encoded).hexdigest()
    envelope["integrity_hash"] = integrity_hash
    return integrity_hash, envelope

