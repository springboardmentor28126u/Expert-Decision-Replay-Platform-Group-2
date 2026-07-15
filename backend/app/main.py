from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth

# Initialize Database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform API")

# Configure CORS for local development with the React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def root():
    return {"message": "Expert Decision Replay Platform API is running"}

# Include routers
app.include_router(auth.router, prefix="/api")