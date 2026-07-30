from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import models
from app.models.user import User
from app.models.decision import Decision
from app.models.alternative import Alternative
from app.models.file import File
from app.models.discussion import Discussion
from app.models.version import Version

# Import routers
from app.routers.auth import router as auth_router
from app.routers.decision import router as decision_router
from app.routers.alternative import router as alternative_router
from app.routers.file import router as file_router
from app.routers.discussion import router as discussion_router
from app.routers.version import router as version_router
from app.routers.dashboard import router as dashboard_router
from app.routers.file import router as file_router
from app.routers.profile import router as profile_router
# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(decision_router)
app.include_router(alternative_router)
app.include_router(file_router)
app.include_router(discussion_router)
app.include_router(version_router)
app.include_router(dashboard_router)
app.include_router(file_router)
app.include_router(profile_router)
# Root API
@app.get("/")
def read_root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }