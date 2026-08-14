import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

sess = SessionLocal()
user = sess.query(User).filter(User.email=='test-user@example.com').first()
if not user:
    print('user not found')
else:
    user.password = hash_password('TestPass123!')
    sess.add(user)
    sess.commit()
    print('password reset')
sess.close()
