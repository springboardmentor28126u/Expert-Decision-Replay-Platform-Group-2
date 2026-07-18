"""
Expert Decision Replay Platform - Validators Utils

Input validation and sanitization utilities.
"""

import re
from fastapi import HTTPException, status


def sanitize_input(value: str) -> str:
    """
    Sanitize string input to prevent XSS and SQLi basic attempts.
    In a real-world scenario, this would be more robust or use a library like bleach.
    """
    if not value:
        return value
    
    # Remove HTML tags
    clean_value = re.sub(r'<[^>]*?>', '', value)
    
    # Basic SQL injection prevention (very rudimentary)
    # SQLAlchemy handles most of this, but it's good practice for raw queries or specific inputs
    dangerous_keywords = ['DROP TABLE', 'DELETE FROM', 'UPDATE ', 'INSERT INTO', '--']
    for keyword in dangerous_keywords:
        if keyword.lower() in clean_value.lower():
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input detected."
            )
             
    return clean_value.strip()

def validate_password_strength(password: str) -> bool:
    """
    Validate password strength.
    Requires at least 8 characters, one uppercase, one lowercase, one number.
    """
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True
