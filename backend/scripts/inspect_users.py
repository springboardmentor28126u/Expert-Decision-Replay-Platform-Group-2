import os
import sys

# Ensure the backend folder is on sys.path so `app` imports resolve
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.database import SessionLocal
from app.models.user import User

session = SessionLocal()
users = session.query(User).all()
for u in users:
    print(f"id={u.id}, email={u.email}, full_name={u.full_name}, role={u.role}, is_active={u.is_active}, password_hash={u.password}")
session.close()
