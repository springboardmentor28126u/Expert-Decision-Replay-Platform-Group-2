"""Check DB tables"""
from sqlalchemy import create_engine, text

e = create_engine("postgresql://postgres:7410@localhost:5432/expert_decision")
c = e.connect()

# Check all tables
result = c.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
print("Tables:")
for row in result:
    print(f"  {row[0]}")

# Check alembic version
r = c.execute(text("SELECT version_num FROM alembic_version"))
print(f"\nAlembic version: {r.scalar()}")

c.close()
