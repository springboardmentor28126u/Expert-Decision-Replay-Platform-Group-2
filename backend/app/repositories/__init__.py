# repositories/__init__.py
"""
repositories/

All raw SQLAlchemy queries live here. Services never write queries
directly; they call repository methods. This makes swapping ORMs,
adding caching, or moving a table to a different DB trivial later
without touching business logic.
"""

