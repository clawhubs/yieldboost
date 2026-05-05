import logging
import re


SENSITIVE_PATTERNS = [
    re.compile(r"0x[a-fA-F0-9]{64}"),
    re.compile(r"\b(?:seed phrase|mnemonic|private key)\b", re.IGNORECASE),
]


def sanitize_text(value: str) -> str:
    sanitized = value
    for pattern in SENSITIVE_PATTERNS:
        sanitized = pattern.sub("[redacted]", sanitized)
    return sanitized


def configure_logging(debug: bool) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

