import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, FileResponse

from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, Body, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, text
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4
from typing import List
from fastapi import UploadFile, File
import io
import time
from reportlab.lib import colors
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from ai_service import summarize_decision, find_similar_decisions, generate_sql_query, is_query_safe, parse_task_command, answer_decision_question, answer_with_file, recommend_approval, generate_problem_statement
from discussion import DiscussionMessage

from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)
from reportlab.platypus import PageTemplate
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from database import engine, Base, get_db
from models import User, UserRole, AuditLog, ReviewerAssignment, ChatHistory, Team
from audit_helper import log_activity, log_security, log_access
from discussion import DiscussionMessage

from uploads import router as uploads_router
from redis_cache import (
    get_cached_data,
    set_cached_data,
    delete_cached_data,
    invalidate_decisions_cache,
    invalidate_dashboard_cache,
    invalidate_admin_dashboard_cache,
)
from notifications import router as notifications_router
from notifications import notify_all_users, Notification
from email_service import queue_email
from schemas import UserCreate, UserLogin, UserResponse, Token, ReviewerAssignmentCreate, ReviewerAssignmentResponse, TeamCreate, TeamUpdate, TeamMemberAssign, TeamResponse, TeamDetailResponse, TeamReportResponse, TeamReportItem
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
# Create all tables (safe to keep, won't duplicate existing ones)
Base.metadata.create_all(bind=engine)

load_dotenv()

try:
    RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))
except ValueError:
    RATE_LIMIT_PER_MIN = 60

from redis_client import get_redis
import logging

logger = logging.getLogger(__name__)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if self.limit <= 0:
            return await call_next(request)

        # Identify client by user ID (email from token sub) or fallback to IP
        client_identifier = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from auth import SECRET_KEY, ALGORITHM
                from jose import jwt
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email = payload.get("sub")
                if email:
                    client_identifier = f"user:{email}"
            except Exception:
                pass

        if not client_identifier:
            client_ip = request.client.host if request.client else "unknown"
            client_identifier = f"ip:{client_ip}"

        current_time = time.time()
        
        # Try to use Redis for rate limiting
        r = get_redis()
        if r is not None:
            try:
                key = f"ratelimit:{client_identifier}"
                member = f"{current_time}:{uuid4()}"
                
                # Sliding window Lua script to check limit and record request atomically
                lua_script = """
                local key = KEYS[1]
                local now = tonumber(ARGV[1])
                local window = tonumber(ARGV[2])
                local limit = tonumber(ARGV[3])
                local member = ARGV[4]

                -- Remove elements older than (now - window)
                redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
                
                -- Count current elements
                local current_requests = redis.call('ZCARD', key)

                if current_requests < limit then
                    -- Record request
                    redis.call('ZADD', key, now, member)
                    redis.call('EXPIRE', key, window)
                    return 1 -- Allowed
                else
                    return 0 -- Rate limited
                end
                """
                
                allowed = r.eval(lua_script, 1, key, current_time, self.window, self.limit, member)
                if not allowed:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Please try again later."}
                    )
                return await call_next(request)
            except Exception as e:
                logger.error(f"Redis rate limiting error: {e}. Falling back to in-memory mode.")

        # Fallback: In-memory sliding window rate limiter
        # Clean up older timestamps
        self.requests[client_identifier] = [
            t for t in self.requests[client_identifier]
            if current_time - t < self.window
        ]
        
        if len(self.requests[client_identifier]) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            
        self.requests[client_identifier].append(current_time)
        return await call_next(request)


class SPAMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "GET":
            accept = request.headers.get("accept", "")
            path = request.url.path
            
            # Allow static files, uploads, and backend docs to bypass
            is_static_or_upload = (
                path.startswith("/uploads") or 
                path.startswith("/assets") or
                path.startswith("/docs") or
                path.startswith("/redoc") or
                path.startswith("/openapi.json") or
                any(path.endswith(ext) for ext in [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".json", ".txt"])
            )
            
            if "text/html" in accept and not is_static_or_upload:
                index_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist", "index.html")
                if os.path.exists(index_path):
                    return FileResponse(index_path)
                    
        return await call_next(request)


app = FastAPI()
app.add_middleware(SPAMiddleware)
app.add_middleware(RateLimitingMiddleware, limit=RATE_LIMIT_PER_MIN)

UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads"
DISCUSSION_UPLOAD_DIR = UPLOAD_ROOT / "discussion"
ALLOWED_DISCUSSION_EXTENSIONS = {".pdf", ".docx", ".jpg", ".jpeg", ".png"}
UPLOAD_ROOT.mkdir(exist_ok=True)
DISCUSSION_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")
app.include_router(uploads_router)
app.include_router(notifications_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Expert Decision Replay Platform backend is running"}


@app.post("/register", response_model=UserResponse, tags=["Authentication"])
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.execute(
        select(User).where(User.email == user.email)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=UserRole.employee,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_security(
        db=db,
        action="register",
        entity_type="user",
        entity_id=new_user.id,
        user_id=new_user.id,
        details="User registered successfully",
    )
    invalidate_admin_dashboard_cache()
    return new_user


@app.post("/login", response_model=Token, tags=["Authentication"])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == credentials.email)
    ).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    log_security(
        db=db,
        action="login",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
        details="User logged in successfully",
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=UserResponse, tags=["Authentication"])
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

from schemas import ChangePassword

@app.put("/me/change-password")
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@app.get("/users", response_model=List[UserResponse], tags=["User Management"])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    users = db.execute(select(User)).scalars().all()
    return users

from schemas import RoleUpdate

@app.put("/users/{user_id}/role", response_model=UserResponse, tags=["User Management"])
def update_user_role(
    user_id: int,
    role_update: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    target_user = db.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    target_user.role = role_update.role
    db.commit()
    db.refresh(target_user)
    invalidate_admin_dashboard_cache()
    return target_user

@app.get("/teams", response_model=List[TeamResponse], tags=["Team Management"])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    teams = db.query(Team).all()

    return [
        TeamResponse(
            id=team.id,
            name=team.name,
            description=team.description,
            manager_id=team.manager_id,
        )
        for team in teams
    ]

@app.post(
    "/teams",
    response_model=TeamResponse,
    status_code=201,
    tags=["Team Management"],
)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.manager, UserRole.admin)
    ),
):
    # Prevent duplicate team names
    existing_team = db.execute(
        select(Team).where(Team.name == team.name)
    ).scalar_one_or_none()

    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="A team with this name already exists.",
        )

    # Validate manager if one is provided
    if team.manager_id is not None:
        manager = db.execute(
            select(User).where(User.id == team.manager_id)
        ).scalar_one_or_none()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager user not found.",
            )

        if manager.role != UserRole.manager:
            raise HTTPException(
                status_code=400,
                detail="Selected user must have the manager role.",
            )

    new_team = Team(
        name=team.name,
        description=team.description,
        manager_id=team.manager_id,
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return new_team

@app.get(
    "/teams/{team_id}",
    response_model=TeamDetailResponse,
    tags=["Team Management"],
)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.execute(
        select(Team).where(Team.id == team_id)
    ).scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    return TeamDetailResponse.from_team(team)

@app.patch(
    "/teams/{team_id}",
    response_model=TeamResponse,
    tags=["Team Management"],
)
def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.manager, UserRole.admin)
    ),
):
    team = db.execute(
        select(Team).where(Team.id == team_id)
    ).scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    update_data = team_update.model_dump(exclude_unset=True)

    # Validate the new manager, if supplied
    if "manager_id" in update_data and update_data["manager_id"] is not None:
        manager = db.execute(
            select(User).where(User.id == update_data["manager_id"])
        ).scalar_one_or_none()

        if not manager:
            raise HTTPException(
                status_code=404,
                detail="Manager user not found.",
            )

        if manager.role != UserRole.manager:
            raise HTTPException(
                status_code=400,
                detail="Selected user must have the manager role.",
            )

    # Prevent duplicate names
    if "name" in update_data:
        existing_team = db.execute(
            select(Team).where(
                Team.name == update_data["name"],
                Team.id != team_id,
            )
        ).scalar_one_or_none()

        if existing_team:
            raise HTTPException(
                status_code=400,
                detail="A team with this name already exists.",
            )

    for field, value in update_data.items():
        setattr(team, field, value)

    db.commit()
    db.refresh(team)

    return team

@app.delete(
    "/teams/{team_id}",
    status_code=204,
    tags=["Team Management"],
)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.admin)
    ),
):
    team = db.execute(
        select(Team).where(Team.id == team_id)
    ).scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    db.delete(team)
    db.commit()

    return None

@app.delete(
    "/teams/{team_id}/members/{user_id}",
    response_model=TeamDetailResponse,
    tags=["Team Management"],
)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.manager, UserRole.admin)
    ),
):
    team = db.execute(
        select(Team).where(Team.id == team_id)
    ).scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    user = db.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.team_id != team_id:
        raise HTTPException(
            status_code=400,
            detail="User is not a member of this team.",
        )

    user.team_id = None

    db.commit()
    db.refresh(team)

    return TeamDetailResponse.from_team(team)

@app.post(
    "/teams/{team_id}/members",
    response_model=TeamDetailResponse,
    status_code=200,
    tags=["Team Management"],
)
def add_team_member(
    team_id: int,
    assignment: TeamMemberAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.manager, UserRole.admin)
    ),
):
    team = db.execute(
        select(Team).where(Team.id == team_id)
    ).scalar_one_or_none()

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    user = db.execute(
        select(User).where(User.id == assignment.user_id)
    ).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    user.team_id = team_id

    db.commit()
    db.refresh(user)
    db.refresh(team)

    return TeamDetailResponse.from_team(team)

from schemas import (
    DecisionCreate, DecisionResponse, DecisionStatusUpdate, DecisionReportResponse, ApprovalReportResponse, AuditReportResponse, PaginatedDecisionResponse, )
from models import ( Decision, DecisionStatus, Approval, ApprovalAction, ReviewerAssignment, )
from typing import List as ListType

def _with_creator_name(decision: Decision) -> Decision:
    decision.creator_name = decision.creator.full_name if decision.creator else None
    return decision

def serialize_decision(d: Decision) -> dict:
    return {
        "id": d.id,
        "title": d.title,
        "problem_statement": d.problem_statement,
        "category": d.category,
        "status": d.status.value if hasattr(d.status, "value") else d.status,
        "created_by": d.created_by,
        "creator_name": d.creator_name or (d.creator.full_name if d.creator else None),
        "attachment_url": d.attachment_url,
        "created_at": d.created_at.isoformat() if hasattr(d.created_at, "isoformat") else str(d.created_at),
        "updated_at": d.updated_at.isoformat() if d.updated_at and hasattr(d.updated_at, "isoformat") else (str(d.updated_at) if d.updated_at else None),
    }

@app.post("/decisions", response_model=DecisionResponse, tags=["Decision Management"])
def create_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_decision = Decision(
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        created_by=current_user.id,
        attachment_url=decision.attachment_url,
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)

    log_activity(
        db=db,
        action="create",
        entity_type="decision",
        entity_id=new_decision.id,
        user_id=current_user.id,
        details="Decision created",
    )
    new_decision.creator_name = new_decision.creator.full_name
    
    # Invalidate decisions and dashboard caches
    invalidate_decisions_cache()

    return new_decision

@app.post("/ai/generate-problem-statement", tags=["Decision Management"])
def get_generated_problem_statement(
    title: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
):
    if not title or len(title.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a title first.")

    result = generate_problem_statement(title)

    if result == "AI_RATE_LIMITED":
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please wait a minute and try again.")

    return {"title": title, "problem_statement": result}

@app.get("/decisions", response_model=PaginatedDecisionResponse, tags=["Decision Management"])
def list_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_id: int | None = None,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    if user_id is not None and current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only request your own decisions."
        )

    # Keep pagination values safe
    page = max(page, 1)
    limit = min(max(limit, 1), 100)

    search_key = search.strip().lower() if search else "all"

    cache_key = (
        f"db_cache:decisions:all:search:{search_key}:page{page}:limit{limit}"
        if user_id is None
        else f"db_cache:decisions:user:{user_id}:search:{search_key}:page{page}:limit{limit}"
    )
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    query = select(Decision).options(selectinload(Decision.creator))

    if user_id is not None:
        query = query.where(Decision.created_by == user_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            Decision.title.ilike(search_term)
            | Decision.category.ilike(search_term)
            | Decision.problem_statement.ilike(search_term)
        )

    # Get total number of matching decisions
    count_start = time.perf_counter()

    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar_one()

    print(f"COUNT QUERY TIME: {time.perf_counter() - count_start:.4f}s")

    # Fetch only the required page
    offset = (page - 1) * limit

    query = (
        query
        .order_by(Decision.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    query_start = time.perf_counter()

    decisions = db.execute(query).scalars().all()
    print(f"DECISION QUERY TIME: {time.perf_counter() - query_start:.4f}s")
    for d in decisions:
        d.creator_name = d.creator.full_name if d.creator else None

    log_start = time.perf_counter()

    log_access(
        db=db,
        action="list",
        entity_type="decision",
        entity_id=None,
        user_id=current_user.id,
        details="Listed decisions",

    )  
    print(f"LOG ACCESS TIME: {time.perf_counter() - log_start:4f}s")
    response_data = {
        "items": decisions,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }

    #Enable this later after testing search
    #set_cached_data(cache_key, response_data, expire=300)
    
    return response_data

from datetime import datetime, timedelta

@app.get("/decisions/escalations", response_model=ListType[DecisionResponse], tags=["Approval Workflow"])
def get_escalated_decisions(
    hours: int = 48,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    cutoff = datetime.utcnow() - timedelta(hours=hours)

    decisions = db.execute(
        select(Decision).where(
            Decision.status == DecisionStatus.under_review,
            Decision.created_at <= cutoff,
        )
    ).scalars().all()

    for d in decisions:
        d.creator_name = d.creator.full_name if d.creator else None

    return decisions

@app.get("/decisions/{decision_id}", response_model=DecisionResponse, tags=["Decision Management"])
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"db_cache:decision:{decision_id}"
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    decision.creator_name = decision.creator.full_name if decision.creator else None
    
    serialized = serialize_decision(decision)
    set_cached_data(cache_key, serialized, expire=300)
    return serialized

@app.get("/decisions/{decision_id}/ai-summary", tags=["Decision Management"])
def get_ai_summary(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Use cached summary if it exists and the decision hasn't changed since
    if decision.ai_summary and decision.ai_summary_updated_at and decision.updated_at:
        if decision.ai_summary_updated_at >= decision.updated_at:
            return {
                "decision_id": decision.id,
                "title": decision.title,
                "status": decision.status,
                "category": decision.category,
                "created_by": decision.creator.full_name if decision.creator else None,
                "created_at": decision.created_at,
                "summary": decision.ai_summary,
                "cached": True,
            }

    messages = db.execute(
        select(DiscussionMessage).where(DiscussionMessage.decision_id == decision_id)
    ).scalars().all()
    discussion_text = "\n".join([m.message for m in messages]) if messages else ""

    summary = summarize_decision(decision.problem_statement, discussion_text)

    if summary == "AI_RATE_LIMITED":
        summary = "AI summary temporarily unavailable (rate limit reached) — please try again in a minute."
    elif summary == "AI_EMPTY_RESPONSE" or summary == "AI_ERROR":
        summary = "AI summary could not be generated for this decision. Please try again."
    else:
        decision.ai_summary = summary
        decision.ai_summary_updated_at = datetime.utcnow()
        db.commit()

    return {
        "decision_id": decision.id,
        "title": decision.title,
        "status": decision.status,
        "category": decision.category,
        "created_by": decision.creator.full_name if decision.creator else None,
        "created_at": decision.created_at,
        "summary": summary,
        "cached": False,
    }

@app.get("/decisions/{decision_id}/similar", tags=["Decision Management"])
def get_similar_decisions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    candidate_decisions = db.execute(
        select(Decision)
        .where(Decision.category == decision.category,
                Decision.id != decision.id
                )
                .limit(20)
    ).scalars().all()

    similar = find_similar_decisions(decision, candidate_decisions)

    return {
        "decision_id": decision.id,
        "similar_decisions": [
            {
                "id": d.id,
                "title": d.title,
                "status": d.status,
                "category": d.category,
            }
            for d in similar
        ]
    }

from fastapi import Body

@app.post("/ai/ask", tags=["AI Assistant"])
def ask_ai(
    question: str = Body(..., embed=True),
    history: list = Body(default=[], embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    sql = generate_sql_query(question, history)

    if not is_query_safe(sql):
        raise HTTPException(status_code=400, detail="This question could not be safely answered. Try rephrasing it.")

    try:
        result = db.execute(text(sql))
        rows = [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")

    db.add(ChatHistory(user_id=current_user.id, tab_type="ask", question=question, answer=f"Found {len(rows)} result(s)"))
    db.commit()

    return {
        "question": question,
        "generated_sql": sql,
        "results": rows,
    }

@app.post("/ai/task", tags=["AI Assistant"])
def run_task_command(
    command: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    parsed = parse_task_command(command)
    action = parsed.get("action")
    if action == "rate_limited":
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please wait a minute and try again.")
    decision_id = parsed.get("decision_id")

    if action == "unknown" or not decision_id:
        raise HTTPException(status_code=400, detail="Could not understand that command. Try something like 'escalate decision 34' or 'reassign reviewer for decision 34 to user 5'.")

    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

    if action == "reassign_reviewer":
        new_reviewer_id = parsed.get("new_reviewer_id")
        if not new_reviewer_id:
            raise HTTPException(status_code=400, detail="No reviewer ID specified in command")

        reviewer = db.execute(
            select(User).where(User.id == new_reviewer_id)
        ).scalar_one_or_none()
        if not reviewer:
            raise HTTPException(status_code=404, detail=f"User {new_reviewer_id} not found")

        decision.assigned_reviewer_id = new_reviewer_id
        db.commit()

        db.add(ChatHistory(user_id=current_user.id, decision_id=decision_id, tab_type="task", question=command, answer=f"reassign_reviewer: done"))
        db.commit()

        return {"action": "reassign_reviewer", "decision_id": decision_id, "new_reviewer_id": new_reviewer_id, "status": "done"}

    elif action == "escalate":
        notification = Notification(
            user_id=current_user.id,
            title="Decision Escalated",
            message=f"Decision '{decision.title}' (ID {decision.id}) was flagged for escalation via AI Assistant.",
            type="escalation",
            is_read=False,
            link=f"/decisions/{decision.id}",
        )
        db.add(notification)
        db.commit()

        db.add(ChatHistory(user_id=current_user.id, decision_id=decision_id, tab_type="task", question=command, answer="escalate: flagged"))
        db.commit()

        return {"action": "escalate", "decision_id": decision_id, "status": "flagged"}

    raise HTTPException(status_code=400, detail="Unsupported action")

@app.post("/ai/ask-with-file", tags=["AI Assistant"])
async def ask_with_file(
    question: str = Body(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed_types = ["text/plain", "application/pdf", "image/jpeg", "image/png"]
    mime_type = file.content_type

    if mime_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Supported file types: .txt, .pdf, .jpg, .png")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    answer = answer_with_file(question, file_bytes, mime_type)

    if answer == "AI_RATE_LIMITED":
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please wait a minute and try again.")

    return {"question": question, "answer": answer, "filename": file.filename}

@app.post("/decisions/{decision_id}/ai-ask", tags=["Decision Management"])
def ask_about_decision(
    decision_id: int,
    question: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    messages = db.execute(
        select(DiscussionMessage).where(DiscussionMessage.decision_id == decision_id)
    ).scalars().all()
    discussion_text = "\n".join([m.message for m in messages]) if messages else ""

    approvals = db.execute(
        select(Approval).where(Approval.decision_id == decision_id)
    ).scalars().all()
    approvals_text = "\n".join([
        f"Stage {a.stage}: {a.action} — {a.comment or 'no comment'}" for a in approvals
    ]) if approvals else ""

    answer = answer_decision_question(question, decision, discussion_text, approvals_text)

    if answer == "AI_RATE_LIMITED":
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please wait a minute and try again.")

    db.add(ChatHistory(user_id=current_user.id, decision_id=decision_id, tab_type="ask", question=question, answer=answer))
    db.commit()

    return {"decision_id": decision_id, "question": question, "answer": answer}

@app.get("/ai/history", tags=["AI Assistant"])
def get_chat_history(
    tab_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(ChatHistory).where(ChatHistory.user_id == current_user.id)
    if tab_type:
        query = query.where(ChatHistory.tab_type == tab_type)
    query = query.order_by(ChatHistory.created_at.desc()).limit(20)

    history = db.execute(query).scalars().all()

    return [
        {
            "id": h.id,
            "decision_id": h.decision_id,
            "tab_type": h.tab_type,
            "question": h.question,
            "answer": h.answer,
            "created_at": h.created_at,
        }
        for h in history
    ]

@app.put("/decisions/{decision_id}/status", response_model=DecisionResponse, tags=["Decision Management"])
def update_decision_status(
    decision_id: int,
    status_update: DecisionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.manager, UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if status_update.status in (DecisionStatus.approved, DecisionStatus.rejected):
        raise HTTPException(
            status_code=400,
            detail="Use the /approve or /reject endpoints to move a decision to approved or rejected, so the review is properly recorded with a comment and reviewer."
        )

    decision.status = status_update.status
    db.commit()
    db.refresh(decision)
    invalidate_decisions_cache(decision_id)
    return decision

@app.post("/reviewer-assignments", response_model=ReviewerAssignmentResponse, tags=["Approval Workflow"])
def assign_reviewer_to_category(
    assignment: ReviewerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    reviewer = db.execute(
        select(User).where(User.id == assignment.reviewer_id)
    ).scalar_one_or_none()

    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer user not found")

    if reviewer.role != UserRole.reviewer:
        raise HTTPException(
            status_code=400,
            detail="Assigned user must have the Reviewer role"
        )

    existing = db.execute(
        select(ReviewerAssignment).where(
            func.lower(ReviewerAssignment.category) == assignment.category.lower()
        )
    ).scalar_one_or_none()

    if existing:
        existing.reviewer_id = assignment.reviewer_id
        existing.assigned_by = current_user.id
        db.commit()
        db.refresh(existing)
        existing.reviewer_name = reviewer.full_name
        return existing

    new_assignment = ReviewerAssignment(
        category=assignment.category,
        reviewer_id=assignment.reviewer_id,
        assigned_by=current_user.id,
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    new_assignment.reviewer_name = reviewer.full_name
    return new_assignment


@app.get(
    "/reviewer-assignments",
    response_model=List[ReviewerAssignmentResponse],
    tags=["Approval Workflow"],
)
def list_reviewer_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignments = db.execute(
        select(ReviewerAssignment)
    ).scalars().all()

    for a in assignments:
        a.reviewer_name = a.reviewer.full_name if a.reviewer else None

    return assignments

@app.get("/decisions/{decision_id}/ai-recommendation", tags=["Decision Management"])
def get_approval_recommendation(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("reviewer", "manager", "admin")),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    messages = db.execute(
        select(DiscussionMessage).where(DiscussionMessage.decision_id == decision_id)
    ).scalars().all()
    discussion_text = "\n".join([m.message for m in messages]) if messages else ""

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()
    alternatives_text = "\n".join([
        f"{a.title} — Cost: {a.cost}, Risk: {a.risk_level}, Feasibility: {a.feasibility}" for a in alternatives
    ]) if alternatives else ""

    candidate_decisions = db.execute(
       select(Decision)
       .where(
          Decision.category == decision.category,
          Decision.id != decision.id
       )
       .limit(20)
    ).scalars().all()

    similar = find_similar_decisions(decision, candidate_decisions)
    similar_text = "\n".join([f"{d.title} — {d.status}" for d in similar]) if similar else ""

    recommendation = recommend_approval(decision, discussion_text, alternatives_text, similar_text)

    if recommendation == "AI_RATE_LIMITED":
        raise HTTPException(status_code=429, detail="AI is temporarily rate-limited. Please wait a minute and try again.")

    return {"decision_id": decision_id, "recommendation": recommendation}

from schemas import ApprovalCreate, ApprovalResponse
from models import Approval, ApprovalAction

@app.post("/decisions/{decision_id}/approve", response_model=ApprovalResponse, tags=["Approval Workflow"])
def approve_decision(
    decision_id: int,
    approval: ApprovalCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Check whether this decision was resubmitted after a rejection
    last_resubmission = db.execute(
        select(Approval)
        .where(
            Approval.decision_id == decision_id,
            Approval.action == ApprovalAction.resubmitted )
        .order_by(Approval.created_at.desc())
    ).scalars().first()

# Find the latest approval before the most recent resubmission
    if last_resubmission:
        last_approval = db.execute(
           select(Approval)
           .where(
               Approval.decision_id == decision_id,
               Approval.action == ApprovalAction.approved,
               Approval.created_at > last_resubmission.created_at
            )
            .order_by(Approval.stage.desc())
        ).scalars().first()
    else:
        last_approval = db.execute(
            select(Approval)
            .where(
                Approval.decision_id == decision_id,
                Approval.action == ApprovalAction.approved
            )
            .order_by(Approval.stage.desc())
        ).scalars().first()

    next_stage = 1 if not last_approval else last_approval.stage + 1
    print("Decision ID:", decision_id)

    if last_approval:
       print("Approval ID:", last_approval.id)
       print("Decision ID in Approval:", last_approval.decision_id)
       print("Stage:", last_approval.stage)
       print("Action:", last_approval.action)
       print("Reviewer ID:", last_approval.reviewer_id)
    else:
       print("Last approval: None")

       print("Decision Status:", decision.status)
       print("Next stage:", next_stage)

    if next_stage == 1:
        # Stage 1: Reviewer, Manager, or Admin can approve
        if current_user.role not in (UserRole.reviewer, UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=403, detail="Only a Reviewer, Manager, or Admin can give the initial approval")
    elif next_stage == 2:
        # Stage 2 (final): only Manager or Admin
        if current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=403, detail="Only a Manager or Admin can give final approval")
    else:
        raise HTTPException(status_code=400, detail="This decision has already completed both approval stages")

    if current_user.role == UserRole.reviewer:
       if not decision.category:
           raise HTTPException(
              status_code=400,
              detail="Decision has no category assigned."
        )

       assignment = db.execute(
            select(ReviewerAssignment).where(
                func.lower(ReviewerAssignment.category) == decision.category.lower()
        )
        ).scalar_one_or_none()

       if not assignment:
            raise HTTPException(
              status_code=400,
              detail=f"No reviewer has been assigned for category '{decision.category}'."
        )

       if assignment.reviewer_id != current_user.id:
            raise HTTPException(
               status_code=403,
               detail="This decision is assigned to another Reviewer for its category."
        )
    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.approved,
        comment=approval.comment,
        stage=next_stage,
    )
    db.add(new_approval)

    # Only mark the decision as fully "approved" once stage 2 is done
    if next_stage == 2:
        decision.status = DecisionStatus.approved

    db.commit()
    db.refresh(new_approval)
    new_approval.reviewer_name = current_user.full_name
    invalidate_decisions_cache(decision_id)

    if decision.creator and decision.creator.email:
        heading = "Your decision was approved" if next_stage == 2 else "Your decision passed stage 1 review"
        queue_email(
            background_tasks,
            to_email=decision.creator.email,
            heading=heading,
            message=f"Comment: {approval.comment}" if approval.comment else "No comment was left.",
            decision_title=decision.title,
            decision_id=decision.id,
        )
    return new_approval

@app.post("/decisions/{decision_id}/reject", response_model=ApprovalResponse, tags=["Approval Workflow"])
def reject_decision(
    decision_id: int,
    approval: ApprovalCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.reviewer, UserRole.manager, UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if not approval.comment or not approval.comment.strip():
        raise HTTPException(status_code=400, detail="A comment is required when rejecting a decision")

    if current_user.role == UserRole.reviewer:
       if not decision.category:
          raise HTTPException(
            status_code=400,
            detail="Decision has no category assigned."
        )

       assignment = db.execute(
            select(ReviewerAssignment).where(
                 func.lower(ReviewerAssignment.category) == decision.category.lower()
            )
        ).scalar_one_or_none()

       if not assignment:
          raise HTTPException(
              status_code=400,
              detail=f"No reviewer has been assigned for category '{decision.category}'."
           )

       if assignment.reviewer_id != current_user.id:
          raise HTTPException(
              status_code=403,
              detail="This decision is assigned to another Reviewer for its category."
          )
    last_approval = db.execute(
        select(Approval)
        .where(Approval.decision_id == decision_id, Approval.action == ApprovalAction.approved)
        .order_by(Approval.stage.desc())
    ).scalars().first()
    current_stage = 1 if not last_approval else last_approval.stage + 1

    new_approval = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.rejected,
        comment=approval.comment,
        stage=current_stage,
    )
    db.add(new_approval)

    decision.status = DecisionStatus.rejected
    db.commit()
    db.refresh(new_approval)
    new_approval.reviewer_name = current_user.full_name
    invalidate_decisions_cache(decision_id)

    if decision.creator and decision.creator.email:
        queue_email(
            background_tasks,
            to_email=decision.creator.email,
            heading="Your decision was rejected",
            message=f"Reason: {approval.comment}",
            decision_title=decision.title,
            decision_id=decision.id,
        )
    return new_approval

@app.post("/decisions/{decision_id}/resubmit", response_model=DecisionResponse, tags=["Approval Workflow"])
def resubmit_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if decision.status != DecisionStatus.rejected:
        raise HTTPException(
            status_code=400,
            detail="Only a rejected decision can be resubmitted for review"
        )

    if current_user.id != decision.created_by and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only the decision's creator or an admin can resubmit it"
        )

    last_rejection = db.execute(
        select(Approval)
        .where(Approval.decision_id == decision_id, Approval.action == ApprovalAction.rejected)
        .order_by(Approval.created_at.desc())
    ).scalars().first()

    if last_rejection:
        edited_after_rejection = db.execute(
            select(DecisionVersion)
            .where(DecisionVersion.decision_id == decision_id, DecisionVersion.created_at > last_rejection.created_at)
        ).scalars().first()

        if not edited_after_rejection:
            raise HTTPException(
                status_code=400,
                detail="Please edit the decision to address the rejection feedback before resubmitting."
            )
    
    resubmission_record = Approval(
        decision_id=decision_id,
        reviewer_id=current_user.id,
        action=ApprovalAction.resubmitted,
        comment="Resubmitted for review after rejection",
    )
    db.add(resubmission_record)

    decision.status = DecisionStatus.under_review
    db.commit()
    db.refresh(decision)
    invalidate_decisions_cache(decision_id)
    return decision

@app.get("/decisions/{decision_id}/approvals", response_model=ListType[ApprovalResponse], tags=["Approval Workflow"])
def get_decision_approvals(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    approvals = db.execute(
        select(Approval)
        .where(Approval.decision_id == decision_id)
        .order_by(Approval.created_at)
    ).scalars().all()
    for a in approvals:
        a.reviewer_name = a.reviewer.full_name if a.reviewer else None
    return approvals

from schemas import DecisionUpdate, DecisionVersionResponse
from models import DecisionVersion

@app.put("/decisions/{decision_id}", response_model=DecisionResponse, tags=["Decision Management"])
def update_decision(
    decision_id: int,
    decision_update: DecisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Only the creator or an admin can change/remove an EXISTING attachment
    update_data = decision_update.model_dump(exclude_unset=True)
    if "attachment_url" in update_data and decision.attachment_url:
        if current_user.id != decision.created_by and current_user.role != UserRole.admin:
            raise HTTPException(
                status_code=403,
                detail="Only the decision's creator or an admin can change or remove its attachment"
            )

    # Save a version snapshot of the CURRENT state, before making changes
    max_version = db.execute(
        select(func.max(DecisionVersion.version_number))
        .where(DecisionVersion.decision_id == decision_id)
    ).scalar()

    next_version_number = (max_version or 0) + 1

    snapshot = DecisionVersion(
        decision_id=decision.id,
        version_number=next_version_number,
        title=decision.title,
        problem_statement=decision.problem_statement,
        category=decision.category,
        status=decision.status.value,
        changed_by=current_user.id,
    )
    db.add(snapshot)

    # Now apply the updates
    update_data = decision_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(decision, key, value)

    db.commit()
    db.refresh(decision)
    invalidate_decisions_cache(decision_id)
    return decision


@app.get("/decisions/{decision_id}/versions", response_model=ListType[DecisionVersionResponse], tags=["Version Tracking"])
def get_decision_versions(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    versions = db.execute(
        select(DecisionVersion)
        .where(DecisionVersion.decision_id == decision_id)
        .order_by(DecisionVersion.version_number)
    ).scalars().all()

    return versions

@app.delete("/decisions/{decision_id}", tags=["Decision Management"])
def delete_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    db.delete(decision)
    db.commit()
    invalidate_decisions_cache(decision_id)
    return {"message": "Decision deleted successfully"}


@app.get("/decisions/{decision_id}/export", tags=["Decision Management"])
def export_decision_pdf(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    creator_name = decision.creator.full_name if decision.creator else "Unknown"

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 1 * inch

    def line(text, size=11, bold=False, gap=0.28):
        nonlocal y
        p.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        p.drawString(1 * inch, y, text)
        y -= gap * inch

    line("Expert Decision Replay Platform", size=10, bold=True)
    line("Decision Record", size=16, bold=True, gap=0.4)

    line(f"Title: {decision.title}", bold=True)
    line(f"Status: {decision.status.value.replace('_', ' ').title()}")
    line(f"Category: {decision.category or 'Uncategorized'}")
    line(f"Created by: {creator_name}")
    line(f"Created on: {decision.created_at.strftime('%d %b %Y, %I:%M %p')}", gap=0.4)

    line("Problem Statement:", bold=True)
    # wrap long text manually, simple version
    statement = decision.problem_statement
    words = statement.split()
    current_line = ""
    for word in words:
        if len(current_line) + len(word) < 90:
            current_line += word + " "
        else:
            line(current_line)
            current_line = word + " "
    if current_line:
        line(current_line, gap=0.4)

    if alternatives:
        line("Alternatives Considered:", bold=True)
        for alt in alternatives:
            line(f"- {alt.title}  (Risk: {alt.risk_level.value}, Feasibility: {alt.feasibility.value}, Cost: {alt.cost})")
        y -= 0.1 * inch

    p.setFont("Helvetica-Oblique", 8)
    p.drawString(1 * inch, 0.6 * inch, "Generated from Expert Decision Replay Platform")

    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=decision_{decision_id}.pdf"}
    )


# ===================== ALTERNATIVES ENDPOINTS =====================

from schemas import AlternativeCreate, AlternativeResponse, AlternativeUpdate, AlternativeComparisonResponse
from models import Alternative

@app.post("/alternatives", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def create_alternative(
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == alternative.decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    new_alternative = Alternative(
        decision_id=alternative.decision_id,
        title=alternative.title,
        description=alternative.description,
        pros=alternative.pros,
        cons=alternative.cons,
        cost=alternative.cost,
        risk_level=alternative.risk_level,
        feasibility=alternative.feasibility,
    )

    db.add(new_alternative)
    db.commit()
    db.refresh(new_alternative)

    return new_alternative


@app.get("/decisions/{decision_id}/alternatives", response_model=ListType[AlternativeResponse], tags=["Alternative Comparison"])
def list_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    return alternatives


@app.get("/alternatives/{alternative_id}", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    return alternative


@app.put("/alternatives/{alternative_id}", response_model=AlternativeResponse, tags=["Alternative Comparison"])
def update_alternative(
    alternative_id: int,
    alternative_update: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()
    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    update_data = alternative_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(alternative, key, value)

    db.commit()
    db.refresh(alternative)

    return alternative


@app.delete("/alternatives/{alternative_id}", tags=["Alternative Comparison"])
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(Alternative.id == alternative_id)
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(status_code=404, detail="Alternative not found")

    db.delete(alternative)
    db.commit()

    return {"message": "Alternative deleted successfully"}


@app.get("/decisions/{decision_id}/compare", response_model=AlternativeComparisonResponse, tags=["Alternative Comparison"])
def compare_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    alternatives = db.execute(
        select(Alternative).where(Alternative.decision_id == decision_id)
    ).scalars().all()

    return {
        "decision_id": decision.id,
        "decision_title": decision.title,
        "alternatives": alternatives,
    }


# ===================== DISCUSSION ENDPOINTS =====================

from schemas import DiscussionCreate, DiscussionReplyCreate, DiscussionUpdate, DiscussionResponse
from crud_discussion import (
    add_comment,
    add_meeting_note,
    delete_comment,
    edit_comment,
    get_comment_or_none,
    get_comments_for_decision,
    get_decision_or_none,
    reply_to_comment,
)


def _read_discussion_payload(payload: dict, required_fields: list[str]) -> dict:
    missing_fields = [field for field in required_fields if payload.get(field) in (None, "")]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required field(s): {', '.join(missing_fields)}",
        )
    return payload


async def _parse_discussion_request(request: Request) -> tuple[dict, UploadFile | None]:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        attachment = form.get("attachment")
        payload = {key: value for key, value in form.items() if key != "attachment"}
        if attachment is not None and not hasattr(attachment, "filename"):
            attachment = None
        return payload, attachment

    if content_type.startswith("application/json"):
        return await request.json(), None

    raise HTTPException(status_code=415, detail="Use JSON or multipart/form-data")


def _save_discussion_attachment(attachment: UploadFile | None) -> str | None:
    if not attachment or not attachment.filename:
        return None

    extension = Path(attachment.filename).suffix.lower()
    if extension not in ALLOWED_DISCUSSION_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Attachment must be a PDF, DOCX, JPG, or PNG file",
        )

    filename = f"{uuid4().hex}{extension}"
    file_path = DISCUSSION_UPLOAD_DIR / filename
    with file_path.open("wb") as buffer:
        copyfileobj(attachment.file, buffer)

    return f"/uploads/discussion/{filename}"


@app.post(
    "/discussion",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                }
            }
        }
    }
)
async def add_discussion_comment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["decision_id", "message"])
    discussion = DiscussionCreate(
        decision_id=int(str(payload["decision_id"])),
        message=str(payload["message"]),
        attachment_url=payload.get("attachment_url"),
    )

    if not get_decision_or_none(db, discussion.decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    attachment_url = _save_discussion_attachment(attachment) or discussion.attachment_url
    return add_comment(
        db,
        decision_id=discussion.decision_id,
        user_id=current_user.id,
        message=discussion.message,
        attachment_url=attachment_url,
    )


@app.post(
    "/discussion/meeting-note",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "decision_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["decision_id", "message"]
                    }
                }
            }
        }
    }
)
async def add_discussion_meeting_note(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["decision_id", "message"])
    decision_id = int(str(payload["decision_id"]))
    message = str(payload["message"])
    attachment_url = payload.get("attachment_url")

    if not get_decision_or_none(db, decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    saved_attachment_url = _save_discussion_attachment(attachment) or attachment_url
    return add_meeting_note(
        db,
        decision_id=decision_id,
        user_id=current_user.id,
        message=message,
        attachment_url=saved_attachment_url,
    )


@app.post(
    "/discussion/reply",
    response_model=DiscussionResponse,
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "parent_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["parent_id", "message"]
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "parent_id": {"type": "integer"},
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        },
                        "required": ["parent_id", "message"]
                    }
                }
            }
        }
    }
)
async def reply_to_discussion_comment(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload, attachment = await _parse_discussion_request(request)
    payload = _read_discussion_payload(payload, ["parent_id", "message"])
    discussion_reply = DiscussionReplyCreate(
        parent_id=int(payload["parent_id"]),
        message=str(payload["message"]),
        attachment_url=payload.get("attachment_url"),
    )

    parent = get_comment_or_none(db, discussion_reply.parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent comment not found")
    if not get_decision_or_none(db, parent.decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")

    attachment_url = _save_discussion_attachment(attachment) or discussion_reply.attachment_url
    return reply_to_comment(
        db,
        parent=parent,
        user_id=current_user.id,
        message=discussion_reply.message,
        attachment_url=attachment_url,
    )


@app.get("/discussion/decision/{decision_id}", response_model=ListType[DiscussionResponse], tags=["Discussion Module"])
def get_decision_discussion_thread(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not get_decision_or_none(db, decision_id):
        raise HTTPException(status_code=404, detail="Decision not found")
    return get_comments_for_decision(db, decision_id)


@app.put(
    "/discussion/{discussion_id}",
    response_model=DiscussionResponse, 
    tags=["Discussion Module"],
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "attachment_url": {"type": "string"}
                        }
                    }
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "message": {"type": "string"},
                            "attachment": {"type": "string", "format": "binary"},
                            "attachment_url": {"type": "string"}
                        }
                    }
                }
            }
        }
    }
)
async def edit_discussion_comment(
    discussion_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = get_comment_or_none(db, discussion_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the comment owner can edit this comment")

    payload, attachment = await _parse_discussion_request(request)
    update = DiscussionUpdate(
        message=payload.get("message"),
        attachment_url=payload.get("attachment_url"),
    )
    attachment_url = _save_discussion_attachment(attachment) or update.attachment_url
    if update.message is None and attachment_url is None:
        raise HTTPException(status_code=400, detail="Provide message or attachment")

    return edit_comment(
        db,
        comment=comment,
        user_id=current_user.id,
        message=update.message,
        attachment_url=attachment_url,
    )


@app.delete("/discussion/{discussion_id}", tags=["Discussion Module"])
def delete_discussion_comment(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = get_comment_or_none(db, discussion_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    can_delete = comment.user_id == current_user.id or current_user.role in {
        UserRole.manager,
        UserRole.admin,
    }
    if not can_delete:
        raise HTTPException(status_code=403, detail="Only the owner, manager, or admin can delete this comment")

    delete_comment(db, comment=comment, user=current_user)
    return {"message": "Comment deleted successfully"}

# ============================= DASHBOARD ENDPOINTS =====================

from schemas import (
    EmployeeDashboardResponse,
    ReviewerDashboardResponse,
    ManagerDashboardResponse,
    AdminDashboardResponse,
)

def get_dashboard_stats(
    db: Session,
    user_id: int | None = None,
):
    filters = []

    if user_id is not None:
        filters.append(
            Decision.created_by == user_id
        )

    # Total Decisions
    total_decisions = db.execute(
        select(func.count(Decision.id))
        .where(*filters)
    ).scalar_one()

    # Status Counts
    status_counts = dict(
        db.execute(
            select(
                Decision.status,
                func.count(Decision.id)
            )
            .where(*filters)
            .group_by(Decision.status)
        ).all()
    )

    # Recent Decisions
    recent_decisions = db.execute(
        select(Decision)
        .where(*filters)
        .order_by(Decision.created_at.desc())
        .limit(5)
    ).scalars().all()

    return {
        "total_decisions": total_decisions,
        "draft_decisions": status_counts.get(DecisionStatus.draft, 0),
        "under_review_decisions": status_counts.get(
            DecisionStatus.under_review, 0
        ),
        "approved_decisions": status_counts.get(
            DecisionStatus.approved, 0
        ),
        "rejected_decisions": status_counts.get(
            DecisionStatus.rejected, 0
        ),
        "archived_decisions": status_counts.get(
            DecisionStatus.archived, 0
        ),
        "recent_decisions": recent_decisions,
    }
    
@app.get(
    "/dashboard/employee",
    response_model=EmployeeDashboardResponse,
    tags=["Dashboard"],
)
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"dashboard:employee:user:{current_user.id}"
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    stats = get_dashboard_stats(
        db,
        current_user.id,
    )

    recent_serialized = [serialize_decision(d) for d in stats["recent_decisions"]]
    response_data = {
        "my_decisions": stats["total_decisions"],
        "draft_decisions": stats["draft_decisions"],
        "under_review_decisions": stats["under_review_decisions"],
        "approved_decisions": stats["approved_decisions"],
        "rejected_decisions": stats["rejected_decisions"],
        "archived_decisions": stats["archived_decisions"],
        "recent_decisions": recent_serialized,
    }
    set_cached_data(cache_key, response_data, expire=300)
    return response_data
    
@app.get(
    "/dashboard/reviewer",
    response_model=ReviewerDashboardResponse,
    tags=["Dashboard"],
)
def reviewer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.reviewer:
        raise HTTPException(
            status_code=403,
            detail="Only reviewers can access this dashboard."
        )

    cache_key = "dashboard:reviewer"
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    under_review_decisions = db.execute(
        select(func.count(Decision.id))
        .where(
            Decision.status == DecisionStatus.under_review
        )
    ).scalar_one()

    approved_decisions = db.execute(
        select(func.count(Decision.id))
        .where(
            Decision.status == DecisionStatus.approved
        )
    ).scalar_one()

    rejected_decisions = db.execute(
        select(func.count(Decision.id))
        .where(
            Decision.status == DecisionStatus.rejected
        )
    ).scalar_one()

    recent_under_review = db.execute(
        select(Decision)
        .where(
            Decision.status == DecisionStatus.under_review
        )
        .order_by(Decision.created_at.desc())
        .limit(5)
    ).scalars().all()

    recent_serialized = [serialize_decision(d) for d in recent_under_review]
    response_data = {
        "under_review_decisions": under_review_decisions,
        "approved_decisions": approved_decisions,
        "rejected_decisions": rejected_decisions,
        "recent_under_review": recent_serialized,
    }
    set_cached_data(cache_key, response_data, expire=300)
    return response_data
    
@app.get(
    "/dashboard/manager",
    response_model=ManagerDashboardResponse,
    tags=["Dashboard"],
)
def manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=403,
            detail="Only managers can access this dashboard."
        )

    cache_key = "dashboard:manager"
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    stats = get_dashboard_stats(db)

    recent_serialized = [serialize_decision(d) for d in stats["recent_decisions"]]
    response_data = {
        "total_decisions": stats["total_decisions"],
        "draft_decisions": stats["draft_decisions"],
        "under_review_decisions": stats["under_review_decisions"],
        "approved_decisions": stats["approved_decisions"],
        "rejected_decisions": stats["rejected_decisions"],
        "archived_decisions": stats["archived_decisions"],
        "recent_decisions": recent_serialized,
    }
    set_cached_data(cache_key, response_data, expire=300)
    return response_data
    
@app.get(
    "/dashboard/admin",
    response_model=AdminDashboardResponse,
    tags=["Dashboard"],
)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access this dashboard."
        )

    cache_key = "dashboard:admin"
    cached_data = get_cached_data(cache_key)
    if cached_data is not None:
        return cached_data

    # Reuse dashboard statistics
    stats = get_dashboard_stats(db)

    # Total Users
    total_users = db.execute(
        select(func.count(User.id))
    ).scalar_one()

    # Active Users
    active_users = db.execute(
        select(func.count(User.id))
        .where(User.is_active == True)
    ).scalar_one()

    # Role Counts
    role_counts = dict(
        db.execute(
            select(
                User.role,
                func.count(User.id)
            )
            .group_by(User.role)
        ).all()
    )

    # Total Alternatives
    total_alternatives = db.execute(
        select(func.count(Alternative.id))
    ).scalar_one()

    recent_serialized = [serialize_decision(d) for d in stats["recent_decisions"]]
    response_data = {
        "total_users": total_users,
        "active_users": active_users,
        "employees": role_counts.get(UserRole.employee, 0),
        "reviewers": role_counts.get(UserRole.reviewer, 0),
        "managers": role_counts.get(UserRole.manager, 0),
        "admins": role_counts.get(UserRole.admin, 0),
        "total_alternatives": total_alternatives,
        "total_decisions": stats["total_decisions"],
        "draft_decisions": stats["draft_decisions"],
        "under_review_decisions": stats["under_review_decisions"],
        "approved_decisions": stats["approved_decisions"],
        "rejected_decisions": stats["rejected_decisions"],
        "archived_decisions": stats["archived_decisions"],
        "recent_decisions": recent_serialized,
    }
    set_cached_data(cache_key, response_data, expire=300)
    return response_data

# Report Helper Functions

def build_decision_report(db: Session):
    pass

 # Total decisions
    total_decisions = db.execute(
        select(func.count(Decision.id))
    ).scalar_one()

    # Decisions by status
    status_rows = db.execute(
        select(
            Decision.status,
            func.count(Decision.id)
        )
        .group_by(Decision.status)
    ).all()

    by_status = [
        {
            "status": status.value,
            "count": count,
        }
        for status, count in status_rows
    ]

    # Decisions by category
    category_rows = db.execute(
        select(
            Decision.category,
            func.count(Decision.id)
        )
        .where(Decision.category.is_not(None))
        .group_by(Decision.category)
        .order_by(func.count(Decision.id).desc())
    ).all()

    by_category = [
        {
            "category": category,
            "count": count,
        }
        for category, count in category_rows
    ]

        # Decisions created over time
    time_rows = db.execute(
        select(
            func.date(Decision.created_at).label("period"),
            func.count(Decision.id)
        )
        .group_by(func.date(Decision.created_at))
        .order_by(func.date(Decision.created_at))
    ).all()

    created_over_time = [
        {
            "period": str(period),
            "count": count,
        }
        for period, count in time_rows
    ]

    # Recent decisions
    recent_decisions = db.execute(
        select(Decision)
        .order_by(Decision.created_at.desc())
        .limit(10)
    ).scalars().all()

    recent_data = [
        {
            "id": decision.id,
            "title": decision.title,
            "status": decision.status.value,
            "category": decision.category,
            "created_at": decision.created_at,
        }
        for decision in recent_decisions
    ]

    return {
        "total_decisions": total_decisions,
        "by_status": by_status,
        "by_category": by_category,
        "created_over_time": created_over_time,
        "recent_decisions": recent_data,
    }

@app.get(
    "/reports/team",
    response_model=TeamReportResponse,
    tags=["Reports"],
)
def get_team_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.manager, UserRole.admin)
    ),
):
    teams = db.execute(
        select(Team).order_by(Team.name)
    ).scalars().all()

    report_teams = []

    for team in teams:
        member_count = db.execute(
            select(func.count(User.id)).where(
                User.team_id == team.id
            )
        ).scalar_one()

        decision_count = db.execute(
            select(func.count(Decision.id)).where(
                Decision.created_by.in_(
                    select(User.id).where(User.team_id == team.id)
                )
            )
        ).scalar_one()

        approval_counts = db.execute(
           select(
               Approval.action,
               func.count(Approval.id)
           )
           .join(Decision, Approval.decision_id == Decision.id)
           .where(
               Decision.created_by.in_(
                   select(User.id).where(User.team_id == team.id)
                )
            )
            .group_by(Approval.action)
        ).all()

        counts = {
            str(action.value): count
            for action, count in approval_counts
        }

        report_teams.append(
            TeamReportItem(
                team_id=team.id,
                team_name=team.name,
                member_count=member_count,
                decision_count=decision_count,
                pending_approvals=counts.get("pending", 0),
                approved_approvals=counts.get("approved", 0),
                rejected_approvals=counts.get("rejected", 0),
                escalated_approvals=counts.get("escalated", 0),
            )
        )

    return TeamReportResponse(
        total_teams=len(report_teams),
        teams=report_teams,
    )

@app.get(
    "/reports/team/export/pdf",
    tags=["Reports"],
)
def export_team_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = get_team_report(db, current_user)

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter
    )

    styles = getSampleStyleSheet()
    content = []

    content.append(
       Paragraph(
           "<b>Expert Decision Replay Platform</b>",
           styles["Title"],
        )
    )

    content.append(
       Paragraph(
           "<font size=16 ><b>Team Analytics Report</b></font>",
           styles["Heading2"],
       )
    )

    content.append(
       Paragraph(
           f"Generated On: "
           f"{datetime.now().strftime('%d %B %Y, %I:%M %p')}",
           styles["Normal"],
       )
    )

    content.append(
       Paragraph(
           f"Generated By: {current_user.full_name}",
           styles["Normal"],
       )
    )

    content.append(Spacer(1, 16))

    content.append(
        Paragraph(
            "Team Summary",
            styles["Heading3"]
        )
    )

    summary_data = [
        ["Metric", "Value"],
        ["Total Teams", str(report.total_teams)],
    ]

    summary_table = Table(summary_data, colWidths=[250, 100], hAlign="LEFT")

    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), "#1F4E79"),
            ("TEXTCOLOR", (0, 0), (-1, 0), "white"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, "#CCCCCC"),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )

    content.append(summary_table)
    content.append(Spacer(1, 18))

    content.append(
        Paragraph(
            "Team Activity",
            styles["Heading3"]
        )
    )

    team_data = [
        [
            "Team",
            "Members",
            "Decisions",
            "Pending",
            "Approved",
            "Rejected",
            "Escalated",
        ]
    ]

    for team in report.teams:
        team_data.append([
            team.team_name,
            team.member_count,
            team.decision_count,
            team.pending_approvals,
            team.approved_approvals,
            team.rejected_approvals,
            team.escalated_approvals,
        ])

    team_table = Table(team_data, repeatRows=1, hAlign="LEFT")

    team_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), "#1F4E79"),
            ("TEXTCOLOR", (0, 0), (-1, 0), "white"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, "#CCCCCC"),
            ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )

    content.append(team_table)

    doc.build(
        content,
        onFirstPage=partial(
            add_header_footer,
            report_title="Team Report"
        ),
        onLaterPages=partial(
            add_header_footer,
            report_title="Team Report"
        ),
    )

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; filename=team_report.pdf"
        },
    )

@app.get(
    "/reports/team/export/excel",
    tags=["Reports"],
)
def export_team_report_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = get_team_report(db, current_user)

    workbook = Workbook()

    # -------------------------
    # Summary Sheet
    # -------------------------

    sheet = workbook.active
    sheet.title = "Summary"

    sheet.append(["Metric", "Value"])

    sheet.append([
        "Total Teams",
        report.total_teams
    ])

    for cell in sheet[1]:
        cell.font = Font(
            bold=True,
            color="FFFFFF"
        )
        cell.fill = PatternFill(
            start_color="1F4E79",
            end_color="1F4E79",
            fill_type="solid"
        )
        cell.alignment = Alignment(
            horizontal="center"
        )

    sheet.freeze_panes = "A2"

    # -------------------------
    # Team Activity Sheet
    # -------------------------

    team_sheet = workbook.create_sheet(
        "Team Activity"
    )

    team_sheet.append([
        "Team",
        "Members",
        "Decisions",
        "Pending",
        "Approved",
        "Rejected",
        "Escalated",
    ])

    for team in report.teams:
        team_sheet.append([
            team.team_name,
            team.member_count,
            team.decision_count,
            team.pending_approvals,
            team.approved_approvals,
            team.rejected_approvals,
            team.escalated_approvals,
        ])

    for cell in team_sheet[1]:
        cell.font = Font(
            bold=True,
            color="FFFFFF"
        )
        cell.fill = PatternFill(
            start_color="1F4E79",
            end_color="1F4E79",
            fill_type="solid"
        )
        cell.alignment = Alignment(
            horizontal="center"
        )

    team_sheet.freeze_panes = "A2"
    team_sheet.auto_filter.ref = team_sheet.dimensions

    # -------------------------
    # Column Widths
    # -------------------------

    widths = {
        "A": 25,
        "B": 12,
        "C": 12,
        "D": 12,
        "E": 12,
        "F": 12,
        "G": 12,
    }

    for column, width in widths.items():
        team_sheet.column_dimensions[column].width = width

    # -------------------------
    # Return Excel File
    # -------------------------

    output = io.BytesIO()

    workbook.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                "attachment; filename=team_report.xlsx"
        },
    )
# Decision Reports

@app.get(
    "/reports/decision",
    response_model=DecisionReportResponse,
    tags=["Reports"],
)
def get_decision_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Reports are available only to managers and admins
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    return build_decision_report(db)

from functools import partial

def add_header_footer(canvas, doc, report_title):
    canvas.saveState()

    width, height = letter

    # Header
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(
        50,
        height - 35,
        "Expert Decision Replay Platform"
    )

    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(
        width - 50,
        height - 35,
        report_title
    )

    canvas.line(
        50,
        height - 45,
        width - 50,
        height - 45
    )
    # Footer
    canvas.line(
        50,
        40,
        width - 50,
        40
    )

    canvas.setFont("Helvetica", 8)
    canvas.drawString(
        50,
        25,
        "Generated by Expert Decision Replay Platform"
    )

    canvas.drawRightString(
        width - 50,
        25,
        f"Page {doc.page}"
    )

    canvas.restoreState()

@app.get(
    "/reports/decision/export/pdf",
    tags=["Reports"],
)
def export_decision_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = build_decision_report(db)

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter
    )

    styles = getSampleStyleSheet()

    content = []

   # Title
    from datetime import datetime

    content.append(
       Paragraph(
           "<b><font size=22>Expert Decision Replay Platform</font></b>",
            styles["Title"],
        )
    )

    content.append(
       Paragraph(
           "<font size=16 color='#1F4E79'><b>Decision Analytics Report</b></font>",
            styles["Heading2"],
       )
    )

    content.append(
       Paragraph(
           f"<b>Generated On:</b> {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
           styles["Normal"],
       )
    )

    content.append(
       Paragraph(
           f"<b>Generated By:</b> {current_user.full_name}",
           styles["Normal"],
        )
    )

    content.append(Spacer(1, 16))

    content.append(
       Paragraph(
           "Executive Summary",
            styles["Heading3"]
        )
    )

    summary_data = [
        ["Metric", "Value"],
        [
            "Total Decisions",
             str(report["total_decisions"])
        ],
    ]


    approved = 0
    rejected = 0
    under_review = 0
    draft = 0

    for item in report["by_status"]:
        if item["status"] == "approved":
           approved = item["count"]

        elif item["status"] == "rejected":
            rejected = item["count"]

        elif item["status"] == "under_review":
           under_review = item["count"]

        elif item["status"] == "draft":
           draft = item["count"]


    summary_data.extend(
        [
           ["Approved", str(approved)],
           ["Rejected", str(rejected)],
           ["Under Review", str(under_review)],
           ["Draft", str(draft)],
        ]
    )


    summary_table = Table(
        summary_data,
        colWidths=[220, 120],
        hAlign="LEFT"
    )


    summary_table.setStyle(
        TableStyle([
           ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
           ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

           ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
           ("FONTSIZE", (0, 0), (-1, -1), 10),

           ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
           ("TOPPADDING", (0, 0), (-1, -1), 8),

           ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),

           ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),

           ("ALIGN", (1, 1), (-1, -1), "CENTER"),

           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )


    content.append(summary_table)
    content.append(Spacer(1, 20))


    # Status Table
    content.append(
       Paragraph(
           "Decision Status Summary",
            styles["Heading3"]
       )
    )

    status_data = [
       ["Status", "Count"]
    ]

    for item in report["by_status"]:
        status_data.append(
            [
                item["status"].replace("_", " ").title(),
                str(item["count"])
            ]
         )


    status_table = Table(status_data, colWidths=[220,120], hAlign="LEFT")

    status_table.setStyle(
        TableStyle(
            [
               ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#2E75B6")),
               ("TEXTCOLOR", (0,0), (-1,0), colors.white),

               ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
               ("FONTSIZE", (0,0), (-1,-1), 10),

               ("GRID", (0,0), (-1,-1), 0.5, colors.grey),

               ("BACKGROUND", (0,1), (-1,-1), colors.beige),

               ("ALIGN", (1,1), (-1,-1), "CENTER"),

               ("BOTTOMPADDING", (0,0), (-1,0), 8),
               ("TOPPADDING", (0,0), (-1,-1), 6),
            ]
        )
    )

    content.append(status_table)

    content.append(Spacer(1,20))


# Category Table
    content.append(
       Paragraph(
           "Category-wise Decisions",
            styles["Heading3"]
       )
    )

    category_data = [
        ["Category", "Count"]
    ]

    for item in report["by_category"]:
        category = item["category"] if item["category"] else "Uncategorized"

        category_data.append([
            category,
            str(item["count"])
        ])


    category_table = Table(category_data, colWidths=[220,120], hAlign="LEFT")

    category_table.setStyle(
        TableStyle(
            [
                 ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#548235")),
                 ("TEXTCOLOR",(0,0),(-1,0),colors.white),

                 ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),

                 ("GRID",(0,0),(-1,-1),0.5,colors.grey),

                 ("BACKGROUND",(0,1),(-1,-1),colors.whitesmoke),

                 ("ALIGN",(1,1),(-1,-1),"CENTER"),

                 ("BOTTOMPADDING",(0,0),(-1,0),8),
                 ("TOPPADDING",(0,0),(-1,-1),6),
            ]
        )
    )

    content.append(category_table)
    content.append(Spacer(1,20))


# Recent Decisions
    content.append(
       Paragraph(
           "Recent Decisions",
            styles["Heading3"]
       )
    )

    recent_data = [
       ["ID", "Title", "Status", "Category", "Created"]
    ]

    for decision in report["recent_decisions"]:
        recent_data.append(
            [
               str(decision["id"]),
               decision["title"][:35],
               decision["status"].replace("_"," ").title(),
               decision["category"] or "Uncategorized",
               decision["created_at"].strftime("%d %b %Y")
            ]
        )


    recent_table = Table(recent_data, colWidths=[35,180, 75, 90, 80], hAlign="LEFT")

    recent_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#7030A0")),
                ("TEXTCOLOR",(0,0),(-1,0),colors.white),

                ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),

                ("GRID",(0,0),(-1,-1),0.5,colors.grey),

                ("BACKGROUND",(0,1),(-1,-1),colors.beige),

                ("FONTSIZE",(0,0),(-1,-1),8),

                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),

                ("BOTTOMPADDING",(0,0),(-1,0),8),

                ("TOPPADDING",(0,0),(-1,-1),5),

                ("ALIGN",(0,0),(0,-1),"CENTER"),
                ("ALIGN",(2,1),(-1,-1),"CENTER"),
            ]
        )
    )

    content.append(recent_table)

    content.append(Spacer(1,20))

    content.append(
        Paragraph(
            "<font size='9' color='grey'>This report was automatically generated by the Expert Decision Replay Platform.</font>",
            styles["Italic"]
        )
    )

    doc.build(content, onFirstPage=partial(add_header_footer, report_title="Decision Report"),
              onLaterPages=partial(add_header_footer, report_title="Decision Report"),
    )      

    buffer.seek(0)


    return StreamingResponse(
       buffer,
       media_type="application/pdf",
       headers={
           "Content-Disposition":
           "attachment; filename=decision_report.pdf"
        }
    )

# ============================================================
# Export Decision Report Excel
# ============================================================

@app.get(
    "/reports/decision/export/excel",
    tags=["Reports"],
)
def export_decision_report_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = build_decision_report(db)

    workbook = Workbook()

    # -------------------------
    # Summary Sheet
    # -------------------------

    sheet = workbook.active
    sheet.title = "Summary"

    sheet.append(
        ["Metric", "Value"]
    )

    sheet.append(
        [
            "Total Decisions",
            report["total_decisions"]
        ]
    )

    for cell in sheet[1]:
        cell.font = Font(
           bold=True,
           color="FFFFFF"
        )
        cell.fill = PatternFill(
            start_color="1F4E79",
            end_color="1F4E79",
            fill_type="solid"
        )
        cell.alignment = Alignment(
            horizontal="center"
        )

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions
    # -------------------------
    # Status Sheet
    # -------------------------

    status_sheet = workbook.create_sheet(
        "Status Summary"
    )

    status_sheet.append(
        ["Status", "Count"]
    )

    for item in report["by_status"]:
        status_sheet.append(
            [
                item["status"],
                item["count"]
            ]
        )

    for cell in status_sheet[1]:
        cell.font = Font(
           bold=True,
           color="FFFFFF"
        )
        cell.fill = PatternFill(
            start_color="1F4E79",
            end_color="1F4E79",
            fill_type="solid"
        )
        cell.alignment = Alignment(
            horizontal="center"
        )

    status_sheet.freeze_panes = "A2"
    status_sheet.auto_filter.ref = status_sheet.dimensions

    # -------------------------
    # Category Sheet
    # -------------------------

    category_sheet = workbook.create_sheet(
        "Categories"
    )

    category_sheet.append(
        ["Category", "Count"]
    )

    for item in report["by_category"]:
        category_sheet.append(
            [
                item["category"],
                item["count"]
            ]
        )

    for cell in category_sheet[1]:
        cell.font = Font(
            bold=True,
            color="FFFFFF"
        )
        cell.fill = PatternFill(
           start_color="1F4E79",
           end_color="1F4E79",
           fill_type="solid"
        )
        cell.alignment = Alignment(
           horizontal="center"
        )

    category_sheet.freeze_panes = "A2"
    category_sheet.auto_filter.ref = category_sheet.dimensions


    # Auto width
    for ws in workbook:
        for column in ws.columns:
            max_length = max(
                len(str(cell.value))
                if cell.value
                else 0
                for cell in column
            )

            ws.column_dimensions[
                column[0].column_letter
            ].width = max_length + 3


    buffer = io.BytesIO()

    workbook.save(buffer)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            "attachment; filename=decision_report.xlsx"
        },
    )

# ============================================================
# Approval Reports
# ============================================================

def build_approval_report(
    db: Session,
):

    # Total approval records
    total_approvals = db.execute(
        select(func.count(Approval.id))
    ).scalar_one()

    # Approved records
    approved = db.execute(
        select(func.count(Approval.id))
        .where(Approval.action == ApprovalAction.approved)
    ).scalar_one()

    # Rejected records
    rejected = db.execute(
        select(func.count(Approval.id))
        .where(Approval.action == ApprovalAction.rejected)
    ).scalar_one()

    # Resubmitted records
    # For now, we treat resubmissions as escalated workflow activity.
    escalated = db.execute(
        select(func.count(Approval.id))
        .where(Approval.action == ApprovalAction.resubmitted)
    ).scalar_one()

    # Pending approvals
    #
    # A decision is considered pending when it is currently
    # under review and has not been finally approved/rejected.
    pending = db.execute(
        select(func.count(Decision.id))
        .where(Decision.status == DecisionStatus.under_review)
    ).scalar_one()

    # Approval counts by stage
    level_rows = db.execute(
        select(
            Approval.stage,
            Approval.action,
            func.count(Approval.id)
        )
        .group_by(Approval.stage, Approval.action)
        .order_by(Approval.stage)
    ).all()

    levels = {}

    for stage, action, count in level_rows:
        if stage not in levels:
            levels[stage] = {
                "level": stage,
                "pending": 0,
                "approved": 0,
                "rejected": 0,
                "escalated": 0,
            }

        if action == ApprovalAction.approved:
            levels[stage]["approved"] = count

        elif action == ApprovalAction.rejected:
            levels[stage]["rejected"] = count

        elif action == ApprovalAction.resubmitted:
            levels[stage]["escalated"] = count

    by_level = list(levels.values())

    return {
        "total_approvals": total_approvals,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "escalated": escalated,
        "average_completion_hours": None,
        "by_level": by_level,
    }
@app.get(
    "/reports/approvals",
    response_model=ApprovalReportResponse,
    tags=["Reports"],
)
def get_approval_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only managers and admins can access reports
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )
    return build_approval_report(db)
   
# ============================================================
# Export Approval Report PDF
# ============================================================

@app.get(
    "/reports/approvals/export/pdf",
    tags=["Reports"],
)
def export_approval_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = build_approval_report(db)
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter
    )

    styles = getSampleStyleSheet()

    content = []

    from datetime import datetime

    content.append(
        Paragraph(
            "Expert Decision Replay Platform",
             styles["Title"]
        )
    )

    content.append(
        Paragraph(
            "Approval Analytics Report",
             styles["Heading2"]
        )
    )

    content.append(
        Paragraph(
            f"Generated On: {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            styles["Normal"]
        )
    )

    content.append(
        Paragraph(
            f"Generated By: {current_user.full_name}",
            styles["Normal"]
        )
    )

    content.append(Spacer(1, 20))
    content.append(
       Paragraph(
           "Executive Summary",
            styles["Heading3"]
       )
    )

    summary_data = [
       ["Metric", "Value"],
       ["Total Approvals", str(report["total_approvals"])],
       ["Pending", str(report["pending"])],
       ["Approved", str(report["approved"])],
       ["Rejected", str(report["rejected"])],
       ["Escalated", str(report["escalated"])],
    ]

    summary_table = Table(
        summary_data,
        hAlign="LEFT"
    )

    summary_table.setStyle(
      TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0,1), (-1,-1), colors.beige),
        ("BOTTOMPADDING", (0,0), (-1,0), 10),
        ("ALIGN", (1,1), (-1,-1), "CENTER"),
    ])
)

    content.append(summary_table)
    content.append(Spacer(1, 20))

    content.append(
       Paragraph(
          "Approval Levels",
           styles["Heading3"]
       )
    )

    level_data = [
        ["Stage", "Pending", "Approved", "Rejected", "Escalated"]
    ]

    for level in report["by_level"]:
        level_data.append([
           str(level["level"]),
           str(level["pending"]),
           str(level["approved"]),
           str(level["rejected"]),
           str(level["escalated"]),
        ])

    level_table = Table(
        level_data,
        colWidths=[70, 80, 80, 80, 80],
        hAlign="LEFT"
    )

    level_table.setStyle(
       TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1F4E79")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0,1), (-1,-1), colors.beige),
        ("BOTTOMPADDING", (0,0), (-1,0), 10),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ])
)

    content.append(level_table)
    content.append(Spacer(1, 20))

    content.append(Spacer(1, 25))
    content.append(
       Paragraph(
           "<font size='9' color='grey'>This report was automatically generated by the Expert Decision Replay Platform.</font>",
            styles["Italic"]
       )
    )
    doc.build(
        content,
        onFirstPage=partial(add_header_footer, report_title="Approval Report"),
        onLaterPages=partial(add_header_footer, report_title="Approval Report"),
    )

    buffer.seek(0)
    return StreamingResponse(
       buffer,
       media_type="application/pdf",
       headers={
          "Content-Disposition": "attachment; filename=approval_report.pdf"
       },
    )
# ============================================================
# Export Approval Report Excel
# ============================================================

@app.get(
    "/reports/approvals/export/excel",
    tags=["Reports"],
)
def export_approval_report_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in (UserRole.manager, UserRole.admin):
        raise HTTPException(
            status_code=403,
            detail="Only managers and admins can access reports."
        )

    report = build_approval_report(db)

    workbook = Workbook()

    # -------------------------
    # Summary Sheet
    # -------------------------

    sheet = workbook.active
    sheet.title = "Summary"

    sheet.append(
        ["Metric", "Value"]
    )

    sheet.append(
        [
            "Total Approvals",
            report["total_approvals"]
        ]
    )

    sheet.append(
        [
            "Approved",
            report["approved"]
        ]
    )

    sheet.append(
        [
            "Rejected",
            report["rejected"]
        ]
    )

    sheet.append(
        [
            "Pending",
            report["pending"]
        ]
    )

    sheet.append(
        [
            "Escalated",
            report["escalated"]
        ]
    )


    # -------------------------
    # Level Summary
    # -------------------------

    level_sheet = workbook.create_sheet(
        "Approval Levels"
    )

    level_sheet.append(
        [
            "Level",
            "Pending",
            "Approved",
            "Rejected",
            "Escalated"
        ]
    )


    for item in report["by_level"]:

        level_sheet.append(
            [
                item["level"],
                item["pending"],
                item["approved"],
                item["rejected"],
                item["escalated"]
            ]
        )


    # -------------------------
    # Styling
    # -------------------------

    for ws in workbook:

        for cell in ws[1]:
            cell.font = Font(
                bold=True,
                color="FFFFFF"
            )

            cell.fill = PatternFill(
                start_color="1F4E79",
                end_color="1F4E79",
                fill_type="solid"
            )

            cell.alignment = Alignment(
                horizontal="center"
            )


        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions


        for column in ws.columns:

            max_length = max(
                len(str(cell.value))
                if cell.value
                else 0
                for cell in column
            )

            ws.column_dimensions[
                column[0].column_letter
            ].width = max_length + 3



    buffer = io.BytesIO()

    workbook.save(buffer)

    buffer.seek(0)


    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            "attachment; filename=approval_report.xlsx"
        },
    )


# ============================================================
# Audit Report
# ============================================================

def build_audit_report(
    db: Session,
):
    # --------------------------------------------------------
        # Total audit events
        # --------------------------------------------------------
        total_events = db.execute(
            select(func.count(AuditLog.id))
        ).scalar_one()
    
        # --------------------------------------------------------
        # Events grouped by action
        # --------------------------------------------------------
        action_rows = db.execute(
            select(
                AuditLog.action,
                func.count(AuditLog.id)
            )
            .group_by(AuditLog.action)
            .order_by(func.count(AuditLog.id).desc())
        ).all()
    
        by_action = [
            {
                "action": action,
                "count": count
            }
            for action, count in action_rows
        ]
    
        # --------------------------------------------------------
        # Events grouped by user
        # --------------------------------------------------------
        actor_rows = db.execute(
            select(
                User.id,
                User.full_name,
                func.count(AuditLog.id)
            )
            .join(AuditLog, AuditLog.user_id == User.id)
            .group_by(User.id, User.full_name)
            .order_by(func.count(AuditLog.id).desc())
        ).all()
    
        by_actor = [
            {
                "actor_id": actor_id,
                "actor_name": actor_name,
                "count": count
            }
            for actor_id, actor_name, count in actor_rows
        ]
    
        # --------------------------------------------------------
        # Events over time
        # --------------------------------------------------------
        timeline_rows = db.execute(
            select(
                func.date(AuditLog.created_at),
                func.count(AuditLog.id)
            )
            .group_by(func.date(AuditLog.created_at))
            .order_by(func.date(AuditLog.created_at))
        ).all()
    
        timeline = [
            {
                "period": str(period),
                "count": count
            }
            for period, count in timeline_rows
        ]
    
        # --------------------------------------------------------
        # Security-related events
        # --------------------------------------------------------
        security_actions = [
            "login",
            "logout",
            "password_change",
            "role_change",
            "user_deleted",
            "user_created"
        ]
    
        security_rows = db.execute(
            select(AuditLog)
            .where(
                func.lower(AuditLog.action).in_(
                    [action.lower() for action in security_actions]
                )
            )
            .order_by(AuditLog.created_at.desc())
            .limit(20)
        ).scalars().all()
    
        security_events = [
            {
                "id": event.id,
                "action": event.action,
                "actor": (
                    {
                        "id": event.user.id,
                        "full_name": event.user.full_name,
                        "email": event.user.email
                    }
                    if event.user
                    else None
                ),
                "created_at": event.created_at
            }
            for event in security_rows
        ]
    
        # --------------------------------------------------------
        # Recent audit events
        # --------------------------------------------------------
        recent_rows = db.execute(
            select(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(20)
        ).scalars().all()
    
        recent_events = [
            {
                "id": event.id,
                "action": event.action,
                "entity_type": event.entity_type,
                "actor": (
                    {
                        "id": event.user.id,
                        "full_name": event.user.full_name,
                        "email": event.user.email
                    }
                    if event.user
                    else None
                ),
                "created_at": event.created_at
            }
            for event in recent_rows
        ]
    
        return AuditReportResponse(
            total_events=total_events,
            by_action=by_action,
            by_actor=by_actor,
            timeline=timeline,
            security_events=security_events,
            recent_events=recent_events,
        )
    
@app.get(
    "/reports/audit",
    response_model=AuditReportResponse,
    tags=["Reports"],
)
def get_audit_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only admins can access audit reports
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access audit reports."
        )
    return build_audit_report(db)

    
# ============================================================
# Export Audit Report PDF
# ============================================================

@app.get(
    "/reports/audit/export/pdf",
    tags=["Reports"],
)
def export_audit_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access audit reports."
        )

    report = build_audit_report(db)

    styles = getSampleStyleSheet()

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter
    )

    content = []

    content.append(
        Paragraph(
            "Expert Decision Replay Platform",
            styles["Title"]
        )
    )

    from datetime import datetime

    content.append(
        Paragraph(
            "Audit Report",
             styles["Heading2"]
        )
    )

    content.append(
        Paragraph(
            f"Generated On: {datetime.now().strftime('%d %B %Y, %I:%M %p')}",
            styles["Normal"]
        )
    )

    content.append(
        Paragraph(
            f"Generated By: {current_user.full_name}",
            styles["Normal"]
        )
    )

    content.append(
        Spacer(1,20)
    )

    content.append(
        Paragraph(
            "Audit Summary",
            styles["Heading3"]
        )
    )

    summary_data = [
        ["Metric","Count"],
        ["Total Events",str(report.total_events)],
    ]

    summary_table = Table(summary_data, colWidths=[220,120])
    summary_table.hAlign = "LEFT"

    summary_table.setStyle(
        TableStyle([
            ("GRID",(0,0),(-1,-1),0.5,colors.black),
            ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1F4E79")),
            ("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("ALIGN",(1,1),(-1,-1),"CENTER"),
            ("TOPPADDING",(0,0),(-1,-1),8),
            ("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),10),
            ("RIGHTPADDING",(0,0),(-1,-1),10),
        ])
    )

    content.append(summary_table)
    content.append(Spacer(1,20))

    content.append(
        Paragraph(
            "Events by Action",
            styles["Heading3"]
        )
    )

    action_data = [["Action","Count"]]

    for item in report.by_action:
        action_data.append([
            item.action,
            str(item.count)
        ])

    action_table = Table(action_data, colWidths=[220, 120])
    action_table.hAlign = "LEFT"

    action_table.setStyle(
        TableStyle([
            ("GRID",(0,0),(-1,-1),0.5,colors.black),
            ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1F4E79")),
            ("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("ALIGN",(1,1),(-1,-1),"CENTER"),
            ("TOPPADDING",(0,0),(-1,-1),8),
            ("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),10),
            ("RIGHTPADDING",(0,0),(-1,-1),10),
        ])
    )

    content.append(action_table)
    content.append(Spacer(1,20))

    content.append(
        Paragraph(
            "Top Users",
            styles["Heading3"]
        )
    )

    actor_data = [["User","Events"]]

    for item in report.by_actor:
        actor_data.append([
            item.actor_name,
            str(item.count)
        ])

    actor_table = Table(actor_data, colWidths=[220,120])
    actor_table.hAlign = "LEFT"

    actor_table.setStyle(
        TableStyle([
            ("GRID",(0,0),(-1,-1),0.5,colors.black),
            ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1F4E79")),
            ("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("ALIGN",(1,1),(-1,-1),"CENTER"),
            ("TOPPADDING",(0,0),(-1,-1),8),
            ("BOTTOMPADDING",(0,0),(-1,-1),8),
            ("LEFTPADDING",(0,0),(-1,-1),10),
            ("RIGHTPADDING",(0,0),(-1,-1),10),
        ])
    )

    content.append(actor_table)
    content.append(Spacer(1,20))

    content.append(
       Paragraph(
           "Recent Audit Events",
           styles["Heading3"]
       )
    )

    recent_data = [
       ["Action", "Entity", "Date"]
    ]

    for event in report.recent_events:
        recent_data.append(
            [
               event.action,
               event.entity_type,
               event.created_at.strftime("%d %b %Y")
            ]
        )


    recent_table = Table(
        recent_data,
        colWidths=[150,150,120],
        hAlign="LEFT"
    )

    recent_table.setStyle(
        TableStyle([
           ("GRID",(0,0),(-1,-1),0.5,colors.black),

           ("BACKGROUND",(0,0),(-1,0),
            colors.HexColor("#1F4E79")),

           ("TEXTCOLOR",(0,0),(-1,0),
            colors.white),

           ("FONTNAME",(0,0),(-1,0),
            "Helvetica-Bold"),

           ("ALIGN",(2,1),(-1,-1),
            "CENTER"),

           ("TOPPADDING",(0,0),(-1,-1),8),
           ("BOTTOMPADDING",(0,0),(-1,-1),8),
           ("LEFTPADDING",(0,0),(-1,-1),10),
           ("RIGHTPADDING",(0,0),(-1,-1),10),
    ])
)

    content.append(recent_table)
    doc.build(
        content,
        onFirstPage=partial(add_header_footer, report_title="Audit Report"),
        onLaterPages=partial(add_header_footer, report_title="Audit Report"),
    )
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":"attachment; filename=audit_report.pdf"
        },
    )
# ============================================================
# Export Audit Report Excel
# ============================================================

@app.get(
    "/reports/audit/export/excel",
    tags=["Reports"],
)
def export_audit_report_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can access audit reports."
        )

    report = build_audit_report(db)

    workbook = Workbook()


    # -------------------------
    # Summary Sheet
    # -------------------------

    sheet = workbook.active
    sheet.title = "Summary"

    sheet.append(
        [
            "Metric",
            "Value"
        ]
    )

    sheet.append(
        [
            "Total Events",
            report.total_events
        ]
    )


    # -------------------------
    # Actions Sheet
    # -------------------------

    action_sheet = workbook.create_sheet(
        "Actions"
    )

    action_sheet.append(
        [
            "Action",
            "Count"
        ]
    )

    for item in report.by_action:

        action_sheet.append(
            [
                item.action,
                item.count
            ]
        )


    # -------------------------
    # Users Sheet
    # -------------------------

    user_sheet = workbook.create_sheet(
        "Users"
    )

    user_sheet.append(
        [
            "User",
            "Events"
        ]
    )

    for item in report.by_actor:

        user_sheet.append(
            [
                item.actor_name,
                item.count
            ]
        )


    # -------------------------
    # Recent Events Sheet
    # -------------------------

    event_sheet = workbook.create_sheet(
        "Recent Events"
    )

    event_sheet.append(
        [
            "Action",
            "Entity",
            "Date"
        ]
    )

    for event in report.recent_events:

        event_sheet.append(
            [
                event.action,
                event.entity_type,
                event.created_at.strftime("%d %b %Y")
            ]
        )


    # -------------------------
    # Styling
    # -------------------------

    for ws in workbook:

        for cell in ws[1]:

            cell.font = Font(
                bold=True,
                color="FFFFFF"
            )

            cell.fill = PatternFill(
                start_color="1F4E79",
                end_color="1F4E79",
                fill_type="solid"
            )

            cell.alignment = Alignment(
                horizontal="center"
            )


        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions


        for column in ws.columns:

            max_length = max(
                len(str(cell.value))
                if cell.value
                else 0
                for cell in column
            )

            ws.column_dimensions[
                column[0].column_letter
            ].width = max_length + 3



    buffer = io.BytesIO()

    workbook.save(buffer)

    buffer.seek(0)


    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition":
            "attachment; filename=audit_report.xlsx"
        },
    )


# Serve frontend static files
frontend_dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist_dir):
    app.mount("/", StaticFiles(directory=frontend_dist_dir), name="frontend")

