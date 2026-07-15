import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Expert Decision Replay Platform API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database URL configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/decision_replay"
    )

settings = Settings()
