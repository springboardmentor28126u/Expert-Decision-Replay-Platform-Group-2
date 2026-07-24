"""Check DB state"""
from sqlalchemy import create_engine, text

e = create_engine("postgresql://postgres:7410@localhost:5432/expert_decision")
c = e.connect()

# Check alembic version
r = c.execute(text("SELECT version_num FROM alembic_version"))
print(f"Alembic version: {r.scalar()}")

# Check decisions columns
result = c.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'decisions' ORDER BY ordinal_position"))
print("Decisions columns:")
for row in result:
    print(f"  {row[0]}: {row[1]}")

c.close()
