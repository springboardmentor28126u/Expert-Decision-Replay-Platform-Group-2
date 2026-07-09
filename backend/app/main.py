from fastapi import FastAPI
from app.database import engine, Base
from app.models import user
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "API is running, database connected"}