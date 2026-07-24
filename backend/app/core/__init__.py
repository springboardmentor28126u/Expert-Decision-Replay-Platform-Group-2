# core/__init__.py
"""
core/

Cross-cutting concerns with zero dependency on routers/services/repositories:
password hashing, JWT encode/decode. Nothing in this package imports
from anywhere else in the app — it's the foundation layer everything
else builds on.
"""

