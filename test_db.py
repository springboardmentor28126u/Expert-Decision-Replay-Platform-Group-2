import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database.session import engine
from sqlalchemy import text

def test_db():
    try:
        with engine.connect() as conn:
            print("Successfully connected to DB!")
            
            # Check users table
            res = conn.execute(text("SELECT COUNT(*) FROM users;")).scalar()
            print(f"Users count: {res}")
            
            # Check alembic_version
            try:
                res2 = conn.execute(text("SELECT * FROM alembic_version;")).fetchall()
                print(f"Alembic version: {res2}")
            except Exception as e:
                print("alembic_version table not found or error:", e)
                
    except Exception as e:
        print("Failed to connect or query DB:", e)

if __name__ == "__main__":
    test_db()
