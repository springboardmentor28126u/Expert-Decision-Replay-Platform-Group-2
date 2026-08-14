import os, hashlib
from dotenv import load_dotenv
load_dotenv('backend/.env')

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 15})

expected_hash = hashlib.sha256("password123".encode("utf-8")).hexdigest()
print(f'Expected hash for "password123":\n  {expected_hash}')
print()

with engine.connect() as conn:
    # Show ALL users with their password match status
    result = conn.execute(text(
        "SELECT id, full_name, employee_id, password, status, email_verified, approved FROM users ORDER BY employee_id, id"
    ))
    rows = result.fetchall()
    print(f'{"ID":<5} | {"Name":<22} | {"EmpID":<12} | {"PassOK":<6} | {"Status":<12} | {"Verified"} | {"Approved"}')
    print('-'*85)
    for row in rows:
        stored_pass = row[3]
        match = "YES" if stored_pass == expected_hash else "NO"
        print(f'{row[0]:<5} | {row[1]:<22} | {row[2]:<12} | {match:<6} | {row[4]:<12} | {str(row[5]):<8} | {row[6]}')

    print()
    print('--- Fixing: updating ALL users to correct password hash ---')
    conn.execute(text(f"UPDATE users SET password = '{expected_hash}'"))
    conn.commit()
    print('Done! All passwords reset to password123 hash.')

    # Verify
    result = conn.execute(text(
        "SELECT COUNT(*) FROM users WHERE password = :h"
    ), {"h": expected_hash})
    count = result.fetchone()[0]
    print(f'Users with correct password: {count}')
