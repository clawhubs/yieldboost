from ..core.exceptions import IntegrityError


FORBIDDEN_TERMS = (
    "seed phrase",
    "mnemonic",
    "private key",
    "bypass guardrail",
    "ignore security",
)


async def run(payload_text: str) -> None:
    lowered = payload_text.lower()
    for term in FORBIDDEN_TERMS:
        if term in lowered:
            raise IntegrityError(
                f"Payload rejected by blacklist policy: {term}.",
                status_code=422,
                layer="L1",
            )

