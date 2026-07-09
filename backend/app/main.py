from fastapi import FastAPI
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")

@app.get("/")
def root():
    return {"message": "API is running, database connected"}