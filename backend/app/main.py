from fastapi import FastAPI
from app.core.config import settings
from app.database.database import Base, engine
from app.models.user import User
from app.api.auth import router as auth_router
# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Expert Decision Replay Platform API is running successfully!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }