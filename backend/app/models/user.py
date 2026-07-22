from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    employee = "employee"
    reviewer = "reviewer"
    manager = "manager"
    administrator = "administrator"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.employee)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)