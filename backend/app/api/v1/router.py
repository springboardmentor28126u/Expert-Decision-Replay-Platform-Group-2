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
    approval_chains,
    approval_routing_rules,
    decision_comments,
    roles,
    audit_logs,
    benchmarks,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(approval_chains.router, prefix="/companies", tags=["Approval Chains"])
api_router.include_router(approval_routing_rules.router, prefix="/companies", tags=["Approval Routing Rules"])
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
api_router.include_router(decision_comments.router, prefix="/decisions", tags=["Decision Comments"])
api_router.include_router(categories.router, prefix="/categories", tags=["Decision Categories"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(benchmarks.router, prefix="/decisions", tags=["Benchmarks"])
