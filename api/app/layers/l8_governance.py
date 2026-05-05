from ..core.exceptions import IntegrityError


async def enforce_preflight(recent_request_count: int) -> None:
    if recent_request_count >= 10:
        raise IntegrityError(
            "Safety throttling blocked this wallet due to burst traffic.",
            status_code=429,
            layer="L8",
        )


async def run() -> dict[str, str | int]:
    return {"status": "active", "risk_score": 5}

