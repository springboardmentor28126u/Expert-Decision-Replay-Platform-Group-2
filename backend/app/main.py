from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, team
from app.routers import auth, team as team_router
from app.models import user, team, decision
from app.routers import auth, team as team_router, decision as decision_router
from app.models import user, team, decision, decision_version

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expert Decision Replay Platform")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(team_router.router)
app.include_router(decision_router.router)
@app.get("/")
def root():
    return {"message": "API is running, database connected"}