import os

from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, declarative_base

from dotenv import load_dotenv

import urllib.parse

load_dotenv()

# Retrieve and URL‑encode the DB password, then replace placeholder
_db_password = urllib.parse.quote_plus(os.getenv("DB_PASSWORD", ""))
DATABASE_URL = os.getenv("DATABASE_URL").replace("[DB_PASSWORD]", _db_password)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()