"""Password hashing and verification using bcrypt via passlib."""

import bcrypt

# Fix compatibility between passlib and bcrypt >= 4.0.0
if not hasattr(bcrypt, "__about__"):
    class __about__:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = __about__

_orig_hashpw = bcrypt.hashpw


def _safe_hashpw(password, salt):
    if isinstance(password, str):
        password = password.encode("utf-8")
    if isinstance(password, (bytes, bytearray)) and len(password) > 72:
        password = password[:72]
    return _orig_hashpw(password, salt)


bcrypt.hashpw = _safe_hashpw

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str) -> str:
    """Truncate password to max 72 bytes to prevent bcrypt limit errors."""
    if not password:
        return ""
    if isinstance(password, str):
        return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
    return password


def hash_password(password: str) -> str:
    """Hash a plaintext password.

    Args:
        password: The plaintext password.

    Returns:
        The bcrypt-hashed password string.
    """
    return pwd_context.hash(_truncate_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed password.

    Args:
        plain_password: The plaintext password to check.
        hashed_password: The stored hashed password.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)


