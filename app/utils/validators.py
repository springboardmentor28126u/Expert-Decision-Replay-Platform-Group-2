# utils/validators.py
"""
utils/validators.py

Small reusable validation helpers not tied to a single Pydantic schema.
Field-level rules (password strength, length bounds) stay inline in
schemas/*.py per field via @field_validator — this module is for
cross-field or cross-entity checks called from the service layer.
"""
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email_format(email: str) -> bool:
    """
    Belt-and-braces only — Pydantic's EmailStr (schemas/user.py) already
    validates format at the API boundary. This exists for the rare
    service-layer path that receives an email string without going
    through a Pydantic schema first (e.g. a future bulk-import script).
    """
    return bool(EMAIL_RE.match(email))


def normalize_email(email: str) -> str:
    return email.strip().lower()
