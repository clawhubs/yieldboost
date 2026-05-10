import hashlib
import secrets
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import Request

from .exceptions import IntegrityError

DEFAULT_PLATFORM_SCOPES = [
    "integrity:seal",
    "integrity:unseal",
    "integrity:delete",
    "integrity:read",
    "audit:run",
    "blacklist:check",
    "proof:run",
    "governance:evaluate",
    "handshake:write",
    "status:read",
]


def normalize_scopes(scopes: list[str] | None) -> list[str]:
    if not scopes:
        return list(DEFAULT_PLATFORM_SCOPES)
    normalized = []
    for scope in scopes:
        value = scope.strip()
        if value and value not in normalized:
            normalized.append(value)
    return normalized or list(DEFAULT_PLATFORM_SCOPES)


def hash_api_key(master_key: str, raw_key: str) -> str:
    return hashlib.sha256(f"{master_key}:{raw_key}".encode("utf-8")).hexdigest()


def generate_api_key(environment: str) -> str:
    prefix = "yb_live" if environment == "mainnet" else "yb_test"
    return f"{prefix}_{secrets.token_urlsafe(30).replace('-', 'x').replace('_', 'y')}"


def build_api_key_record(
    *,
    master_key: str,
    app_name: str,
    owner_label: str | None,
    owner_wallet_address: str | None,
    environment: str,
    notes: str | None,
    scopes: list[str] | None,
    plan_id: str | None = None,
    plan_name: str | None = None,
    plan_price_ya: int | None = None,
    plan_price_og: str | None = None,
    plan_max_keys: int | None = None,
    plan_quota_monthly: int | None = None,
    plan_expires_at: str | None = None,
    checkout_tx_hash: str | None = None,
    checkout_integrity_hash: str | None = None,
) -> tuple[str, dict[str, Any]]:
    raw_key = generate_api_key(environment)
    created_at = datetime.now(timezone.utc).isoformat()
    key_id = f"key_{uuid4().hex}"
    record = {
        "key_id": key_id,
        "app_name": app_name,
        "owner_label": owner_label,
        "owner_wallet_address": owner_wallet_address,
        "environment": environment,
        "notes": notes,
        "api_key_hash": hash_api_key(master_key, raw_key),
        "key_preview": f"{raw_key[:11]}...{raw_key[-6:]}",
        "created_at": created_at,
        "last_used_at": None,
        "revoked_at": None,
        "status": "active",
        "scopes": normalize_scopes(scopes),
        "plan_id": plan_id,
        "plan_name": plan_name,
        "plan_price_ya": plan_price_ya,
        "plan_price_og": plan_price_og,
        "plan_max_keys": plan_max_keys,
        "plan_quota_monthly": plan_quota_monthly,
        "plan_expires_at": plan_expires_at,
        "checkout_tx_hash": checkout_tx_hash,
        "checkout_integrity_hash": checkout_integrity_hash,
        "monthly_usage": {},
        "total_requests": 0,
        "success_requests": 0,
        "blocked_requests": 0,
    }
    return raw_key, record


def scope_allows(owned_scopes: list[str], required_scope: str) -> bool:
    if "*" in owned_scopes or required_scope in owned_scopes:
        return True
    family = required_scope.split(":", 1)[0]
    return f"{family}:*" in owned_scopes


async def ensure_api_access(
    request: Request,
    api_key: str | None,
    *,
    required_scopes: list[str] | None = None,
) -> dict[str, Any] | None:
    settings = request.app.state.integrity_pipeline.settings
    store = request.app.state.integrity_pipeline.store

    static_keys = settings.api_keys
    all_managed_keys = await store.list_api_keys(include_revoked=True)

    if not static_keys and not all_managed_keys:
        request.state.api_client = {
            "auth_type": "open",
            "app_name": "Open Access",
            "key_id": None,
            "environment": settings.default_network,
            "scopes": ["*"],
        }
        return request.state.api_client

    if not api_key:
        raise IntegrityError("Missing or invalid API key.", status_code=401)

    if secrets.compare_digest(api_key, settings.master_key):
        client = {
            "auth_type": "internal-master",
            "app_name": "First-Party YieldBoost Proxy",
            "key_id": "internal-master",
            "environment": "multi",
            "scopes": ["*"],
        }
        request.state.api_client = client
        return client

    if api_key in static_keys:
        client = {
            "auth_type": "static",
            "app_name": "Static Environment Key",
            "key_id": "static-env",
            "environment": "multi",
            "scopes": ["*"],
        }
        request.state.api_client = client
        return client

    matched = await store.get_api_key_by_hash(hash_api_key(settings.master_key, api_key))
    if not matched or matched.get("status") != "active":
        raise IntegrityError("Missing or invalid API key.", status_code=401)

    owned_scopes = normalize_scopes(matched.get("scopes"))
    if required_scopes and not any(scope_allows(owned_scopes, scope) for scope in required_scopes):
        raise IntegrityError("API key lacks the required scope.", status_code=403)

    client = {
        "auth_type": "managed",
        "app_name": matched.get("app_name", "Managed Client"),
        "key_id": matched.get("key_id"),
        "environment": matched.get("environment", "multi"),
        "owner_label": matched.get("owner_label"),
        "owner_wallet_address": matched.get("owner_wallet_address"),
        "plan_id": matched.get("plan_id"),
        "plan_name": matched.get("plan_name"),
        "plan_quota_monthly": matched.get("plan_quota_monthly"),
        "scopes": owned_scopes,
    }
    request.state.api_client = client

    expires_at = matched.get("plan_expires_at")
    if expires_at:
        try:
            parsed_expires_at = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        except ValueError:
            parsed_expires_at = None
        if parsed_expires_at and datetime.now(timezone.utc) > parsed_expires_at:
            raise IntegrityError("API key plan has expired. Renew the 0G package to continue.", status_code=403, layer="L8")

    quota_monthly = int(matched.get("plan_quota_monthly") or 0)
    if quota_monthly > 0:
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        monthly_usage = matched.get("monthly_usage") or {}
        month_count = int(monthly_usage.get(current_month) or 0)
        if month_count >= quota_monthly:
            raise IntegrityError("API key monthly quota exceeded.", status_code=429, layer="L8")

    return client


def ensure_admin_access(
    request: Request,
    *,
    wallet_address: str | None,
    api_key: str | None,
    master_key: str | None,
) -> dict[str, Any]:
    settings = request.app.state.integrity_pipeline.settings

    if master_key and secrets.compare_digest(master_key, settings.master_key):
        client = {
            "auth_type": "master",
            "app_name": "Founder Console",
            "key_id": "master-console",
            "environment": "multi",
        }
        request.state.api_client = client
        return client

    if settings.api_keys and (not api_key or api_key not in settings.api_keys):
        raise IntegrityError("Missing or invalid API key.", status_code=401)

    founder_wallet = settings.resolved_founder_wallet_address
    if not founder_wallet:
        raise IntegrityError("Founder wallet is not configured.", status_code=403)
    if not wallet_address or wallet_address.lower() != founder_wallet.lower():
        raise IntegrityError("Founder wallet required.", status_code=403)

    client = {
        "auth_type": "founder-wallet",
        "app_name": "Founder Wallet",
        "key_id": "founder-wallet",
        "environment": "multi",
    }
    request.state.api_client = client
    return client
