from datetime import datetime


def build_challenge_message(
    *,
    challenge_id: str,
    operation: str,
    network: str,
    wallet_address: str,
    issued_at: str,
    expires_at: str,
    storage_id: str | None = None,
) -> str:
    storage_value = storage_id or "-"
    return "\n".join(
        [
            "YieldBoost Integrity API Challenge",
            f"Challenge ID: {challenge_id}",
            f"Operation: {operation}",
            f"Network: {network}",
            f"Wallet: {wallet_address}",
            f"Storage ID: {storage_value}",
            f"Issued At: {issued_at}",
            f"Expires At: {expires_at}",
        ]
    )
