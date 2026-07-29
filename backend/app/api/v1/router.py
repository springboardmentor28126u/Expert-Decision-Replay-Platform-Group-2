"""
Expert Decision Replay Platform - V1 APIRouter

Aggregates all V1 routers.
"""

from fastapi import APIRouter

from app.api.v1 import (
    admin_groups,
    auth,
    users,
    teams,
    companies,
    groups,
    group_requests,
    my_requests,
    notifications,
    decisions,
    alternatives,
    categories,
    approvals,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(group_requests.router, prefix="/group-requests", tags=["Group Join Requests"])
api_router.include_router(my_requests.router, prefix="/my-requests", tags=["Group Join Requests"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])
api_router.include_router(admin_groups.router, prefix="/admin/groups", tags=["Admin Groups"])
api_router.include_router(decisions.router, prefix="/decisions", tags=["Decisions"])
api_router.include_router(alternatives.router, prefix="/decisions", tags=["Alternatives"])
api_router.include_router(approvals.router, prefix="/decisions", tags=["Approvals"])
api_router.include_router(categories.router, prefix="/categories", tags=["Decision Categories"])
