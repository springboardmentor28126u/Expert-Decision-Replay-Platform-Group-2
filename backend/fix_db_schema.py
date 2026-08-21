"""
Helper script to drop the old approval_chain_configs table
and recreate it with the new schema (company_id, group_id, category, levels, sla_hours).
"""

from sqlalchemy import text
from app.database.session import engine
from app.database.base import Base
import app.models  # ensure models are registered

print("Dropping old approval_chain_configs table if exists...")
with engine.connect() as conn:
    conn.execute(text("DROP TABLE IF EXISTS approval_chain_configs CASCADE;"))
    conn.commit()
print("Table dropped.")

print("Recreating database tables...")
Base.metadata.create_all(bind=engine)
print("Database schema successfully synchronized!")
