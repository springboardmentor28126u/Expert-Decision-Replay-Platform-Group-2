from fastapi import FastAPI
from app.core.config import settings
from app.database.database import Base, engine
from app.models.user import User
from app.models.decision import Decision
from app.api.auth import router as auth_router
from app.core.dependencies import get_current_user
from app.models.user import User
from fastapi import Depends
from app.api.decision import router as decision_router
from app.models.decision_history import DecisionHistory

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME)

app.include_router(auth_router)
app.include_router(decision_router)

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


@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/create-tables")
def create_tables():
    Base.metadata.create_all(bind=engine)
    return {"message": "Tables created successfully"}