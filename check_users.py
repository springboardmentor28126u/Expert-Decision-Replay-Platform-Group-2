import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database.session import engine
from sqlalchemy import text
from app.core.security import verify_password, decode_token
from app.models.user import User
from app.models.role import Role

def check_login():
    try:
        with engine.connect() as conn:
            # Let's see the users
            users = conn.execute(text("SELECT u.id, u.email, u.password_hash, u.created_at, u.updated_at, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id;")).fetchall()
            print("Users:", users)
            if not users:
                print("No users to check!")
                return
                
            u = users[0]
            print(f"Checking user: {u.email}, role: {u.role_name}, created_at: {u.created_at}")
            # check if hash is bcrypt
            is_bcrypt = u.password_hash.startswith("$2b$")
            print(f"Is bcrypt hash? {is_bcrypt}")

            # Note: team_id is not in the query, let's query it
            team_res = conn.execute(text(f"SELECT team_id FROM users WHERE id = '{u.id}'")).scalar()
            print(f"Team ID: {team_res}")

    except Exception as e:
        print("Failed:", e)

if __name__ == "__main__":
    check_login()
