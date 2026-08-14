import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.database import SessionLocal
from app.models.user import User
from app.utils.security import verify_password
from app.utils.security import hash_password, pwd_context

sess = SessionLocal()
user = sess.query(User).filter(User.email=='test-user@example.com').first()
print('user:', user.email if user else None)
if user:
    print('hash:', user.password)
    print('hash repr:', repr(user.password))
    print('verify(TestPass123!):', verify_password('TestPass123!', user.password))
    print('verify(wrongpass):', verify_password('wrong', user.password))
    # sanity check: generate a new hash and verify
    new_hash = hash_password('TestPass123!')
    print('new_hash:', new_hash)
    print('verify against new hash:', verify_password('TestPass123!', new_hash))
sess.close()
