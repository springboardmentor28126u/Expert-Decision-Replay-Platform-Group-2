# services/__init__.py
"""
services/

Business rules layer. Framework-agnostic — testable without spinning
up FastAPI (tests/unit/*). Services never write raw SQLAlchemy queries
directly; they call repository methods.
"""

