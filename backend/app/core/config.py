import os
from dotenv import load_dotenv

# Load env variables from the root .env file if it exists
# We walk up to check for .env in the parent folders
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "Expert Decision Replay Platform"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "9e7e72a84a60183b16cf29d665f80b181db5c104e142e0fa525287e07b8b209e")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/expert_decision_replay")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/Users/radhikaapatil/.gemini/antigravity-ide/scratch/expert_decision_replay_platform/backend/app/uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760")) # 10MB default

settings = Settings()
