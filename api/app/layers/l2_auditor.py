import hashlib

from ..core.exceptions import IntegrityError


async def run(payload: bytes, *, max_payload_bytes: int) -> str:
    if not payload:
        raise IntegrityError("Payload is empty.", status_code=400, layer="L2")
    if len(payload) > max_payload_bytes:
        raise IntegrityError("Payload exceeds maximum allowed size.", status_code=413, layer="L2")
    return hashlib.sha256(payload).hexdigest()

