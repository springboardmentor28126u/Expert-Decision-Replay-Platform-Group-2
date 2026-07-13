# dependencies/__init__.py
"""
dependencies/

Shared FastAPI dependencies used across multiple routers:
get_current_user, require_role. Kept separate from core/ because these
DO know about FastAPI, the DB session, and the User model — core/
deliberately does not.
"""
