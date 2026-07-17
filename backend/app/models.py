from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # User Details
    full_name = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, nullable=False, index=True)

    password = Column(String(255), nullable=False)

    # Role Management
    role = Column(String(50), nullable=False, default="Employee")

    # Team Management
    department = Column(String(100), nullable=True)

    team = Column(String(100), nullable=True)

    # User Status
    is_active = Column(Boolean, default=True)

    # Registration Date
    created_at = Column(DateTime, default=datetime.utcnow)