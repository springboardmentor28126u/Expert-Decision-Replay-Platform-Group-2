from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app import models
from app.routes import router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expert Decision Replay Platform",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:3000",   # React (Create React App)
    "http://localhost:5173",   # React (Vite)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
# Root API
@app.get("/")
def read_root():
    return {
        "message": "Expert Decision Replay Platform API is running"
    }

# Authentication routes will be added later
# app.include_router(auth_router)