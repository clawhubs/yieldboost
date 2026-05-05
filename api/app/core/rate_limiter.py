import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Deque

from fastapi import Request

from .exceptions import IntegrityError


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    limit: int
    window_seconds: int


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def hit(self, key: str, *, limit: int, window_seconds: int) -> int | None:
        now = time.monotonic()
        threshold = now - window_seconds
        async with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= threshold:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                return retry_after
            bucket.append(now)
            return None


def client_ip(request: Request) -> str:
    forwarded = (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-real-ip")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    )
    if forwarded:
        return forwarded
    if request.client:
        return request.client.host
    return "unknown"


def ip_rule_for_request(request: Request) -> RateLimitRule | None:
    if request.method.upper() != "POST":
        return None

    settings = request.app.state.settings
    path = request.url.path
    if path == "/v1/auth/challenge":
        return RateLimitRule("auth_challenge_ip", settings.rate_limit_auth_challenge_ip, settings.rate_limit_window_seconds)
    if path in {"/v1/integrity/seal", "/v1/vault/seal"}:
        return RateLimitRule("integrity_seal_ip", settings.rate_limit_seal_ip, settings.rate_limit_window_seconds)
    if path in {"/v1/integrity/unseal", "/v1/vault/unseal"}:
        return RateLimitRule("integrity_unseal_ip", settings.rate_limit_unseal_ip, settings.rate_limit_window_seconds)
    return None


async def enforce_ip_rate_limit(request: Request) -> int | None:
    settings = request.app.state.settings
    if not settings.rate_limit_enabled:
        return None
    rule = ip_rule_for_request(request)
    if not rule:
        return None
    key = f"ip:{rule.name}:{client_ip(request)}"
    return await request.app.state.rate_limiter.hit(
        key,
        limit=rule.limit,
        window_seconds=rule.window_seconds,
    )


async def enforce_wallet_rate_limit(request: Request, *, operation: str, wallet_address: str) -> None:
    settings = request.app.state.settings
    if not settings.rate_limit_enabled:
        return

    limits = {
        "challenge": settings.rate_limit_auth_challenge_wallet,
        "seal": settings.rate_limit_seal_wallet,
        "unseal": settings.rate_limit_unseal_wallet,
    }
    limit = limits.get(operation)
    if not limit:
        return
    retry_after = await request.app.state.rate_limiter.hit(
        f"wallet:{operation}:{wallet_address.lower()}",
        limit=limit,
        window_seconds=settings.rate_limit_window_seconds,
    )
    if retry_after is None:
        return
    raise IntegrityError(
        "Too many requests. Please wait before trying again.",
        status_code=429,
        layer="L8",
        detail={"retry_after_seconds": retry_after, "scope": "wallet", "operation": operation},
    )
