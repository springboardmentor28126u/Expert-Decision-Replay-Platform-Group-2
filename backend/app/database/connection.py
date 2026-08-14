import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./edrp.db")

# Detect database type
_is_sqlite = "sqlite" in DATABASE_URL

if _is_sqlite:
    # Local development fallback – SQLite requires check_same_thread=False
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL (production / Docker) – do NOT test connection at import time.
    # The entrypoint.sh + depends_on healthcheck guarantees postgres is up
    # before this module is loaded. An eager test here would silently fall back
    # to SQLite if the DB is even slightly slow, causing data-loss bugs.
    engine = create_engine(
        DATABASE_URL,
        connect_args={"connect_timeout": 10},
        pool_pre_ping=True,   # validates connections before handing them out
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


from app.database.base import Base
from app import models

from sqlalchemy import inspect

def ensure_user_schema_columns():
    try:
        inspector = inspect(engine)
        columns_to_add = [
            ("users", "email_verified", "BOOLEAN DEFAULT FALSE"),
            ("users", "approved", "BOOLEAN DEFAULT FALSE"),
            ("users", "status", "VARCHAR(50) DEFAULT 'Pending Approval'"),
            ("users", "approved_by", "VARCHAR(100)"),
            ("users", "approved_at", "VARCHAR(50)"),
            ("users", "rejected_by", "VARCHAR(100)"),
            ("users", "rejected_at", "VARCHAR(50)"),
            ("users", "created_at", "VARCHAR(50)"),
            ("users", "updated_at", "VARCHAR(50)"),
            ("users", "email_hash", "VARCHAR(64)"),
            ("users", "email_original", "VARCHAR(100)"),
            ("comments", "meeting_note_id", "INTEGER REFERENCES meeting_notes(id)"),
            ("meeting_notes", "meeting_link", "TEXT"),
        ]
        
        with engine.connect() as conn:
            for table_name, col_name, col_def in columns_to_add:
                try:
                    if inspector.has_table(table_name):
                        existing_cols = [c["name"] for c in inspector.get_columns(table_name)]
                        if col_name not in existing_cols:
                            sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def};"
                            conn.execute(text(sql))
                            conn.commit()
                except Exception:
                    pass
            try:
                conn.execute(text("UPDATE users SET approved = TRUE, status = 'Active', email_verified = TRUE, is_active = TRUE WHERE status IS NULL OR status = '' OR status = 'Active';"))
                conn.execute(text("UPDATE users SET email_original = email WHERE (email_original IS NULL OR email_original = '') AND email LIKE '%@%';"))
                conn.commit()
            except Exception:
                pass
    except Exception as e:
        print(f"Schema migration helper note: {e}")
        try:
            import hashlib
            from app.models.user import User, VerificationCode
            from app.models.email_verification import EmailVerification
            db = SessionLocal()
            
            # 1. Users table
            all_users = db.query(User).all()
            updated_count = 0
            for u in all_users:
                if u.email:
                    normalized_email = u.email.strip().lower()
                    u.email = normalized_email
                    if not u.email_hash:
                        u.email_hash = normalized_email
                    updated_count += 1

            # 2. VerificationCode table
            try:
                vc_codes = db.query(VerificationCode).all()
                for vc in vc_codes:
                    if vc.email:
                        normalized_email = vc.email.strip().lower()
                        vc.email = normalized_email
                        updated_count += 1
            except Exception as _e:
                pass

            # 3. EmailVerification table
            try:
                ev_codes = db.query(EmailVerification).all()
                for ev in ev_codes:
                    if ev.email:
                        normalized_email = ev.email.strip().lower()
                        ev.email = normalized_email
                        updated_count += 1
            except Exception as _e:
                pass

            if updated_count > 0:
                db.commit()
                print(f"Migrated {updated_count} email fields to SHA-256 hash values in database.")
            db.close()
        except Exception as migration_err:
            print(f"Migration fallback note: {migration_err}")

ensure_user_schema_columns()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()