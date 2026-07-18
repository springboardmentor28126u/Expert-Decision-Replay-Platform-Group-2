"""
Expert Decision Replay Platform - V1 APIRouter

Aggregates all V1 routers.
"""

from fastapi import APIRouter

from app.api.v1 import auth, users, roles, teams, decisions, alternatives, categories

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
api_router.include_router(alternatives.router, prefix="/decisions", tags=["Alternatives"])
api_router.include_router(categories.router, prefix="/categories", tags=["Decision Categories"])

