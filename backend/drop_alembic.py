from sqlalchemy import text
from app.database.session import engine
with engine.begin() as conn:
    conn.execute(text('DROP SCHEMA public CASCADE; CREATE SCHEMA public;'))
