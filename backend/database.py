from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the connection engine
engine = create_engine(DATABASE_URL)

# Create a session factory (used to talk to the DB in each request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all our table models will inherit from
Base = declarative_base()

# Dependency function - gives each API request its own DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()