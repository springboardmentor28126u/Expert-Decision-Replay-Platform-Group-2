from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from database import engine, Base, get_db
from models import User

from schemas import UserCreate, UserLogin, UserResponse, Token

from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
# Create all tables (safe to keep, won't duplicate existing ones)
Base.metadata.create_all(bind=engine)

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Expert Decision Replay Platform backend is running"}


@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.execute(
        select(User).where(User.email == user.email)
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=UserRole.employee,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == credentials.email)
    ).scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

from typing import List
from models import UserRole

@app.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    users = db.execute(select(User)).scalars().all()
    return users

from schemas import RoleUpdate

@app.put("/users/{user_id}/role", response_model=UserResponse)
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

    return target_user

from schemas import DecisionCreate, DecisionResponse, DecisionStatusUpdate
from models import Decision, DecisionStatus
from typing import List as ListType

@app.post("/decisions", response_model=DecisionResponse)
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
    )
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision


@app.get("/decisions", response_model=ListType[DecisionResponse])
def list_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decisions = db.execute(select(Decision)).scalars().all()
    return decisions


@app.get("/decisions/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@app.put("/decisions/{decision_id}/status", response_model=DecisionResponse)
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

    decision.status = status_update.status
    db.commit()
    db.refresh(decision)
    return decision

from schemas import AlternativeCreate, AlternativeResponse, AlternativeUpdate
from models import Alternative

@app.post("/alternatives", response_model=AlternativeResponse)
def create_alternative(
    alternative: AlternativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if the decision exists
    decision = db.execute(
        select(Decision).where(Decision.id == alternative.decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found"
        )

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

@app.get(
    "/decisions/{decision_id}/alternatives",
    response_model=ListType[AlternativeResponse],
)
def list_alternatives(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    decision = db.execute(
        select(Decision).where(Decision.id == decision_id)
    ).scalar_one_or_none()

    if not decision:
        raise HTTPException(
            status_code=404,
            detail="Decision not found",
        )

    alternatives = db.execute(
        select(Alternative).where(
            Alternative.decision_id == decision_id
        )
    ).scalars().all()

    return alternatives

@app.get(
    "/alternatives/{alternative_id}",
    response_model=AlternativeResponse,
)
def get_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(
            Alternative.id == alternative_id
        )
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found",
        )

    return alternative

@app.put(
    "/alternatives/{alternative_id}",
    response_model=AlternativeResponse,
)
def update_alternative(
    alternative_id: int,
    alternative_update: AlternativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(
            Alternative.id == alternative_id
        )
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found",
        )

    update_data = alternative_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(alternative, key, value)

    db.commit()
    db.refresh(alternative)

    return alternative

@app.delete("/alternatives/{alternative_id}")
def delete_alternative(
    alternative_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alternative = db.execute(
        select(Alternative).where(
            Alternative.id == alternative_id
        )
    ).scalar_one_or_none()

    if not alternative:
        raise HTTPException(
            status_code=404,
            detail="Alternative not found"
        )

    db.delete(alternative)
    db.commit()

    return {
        "message": "Alternative deleted successfully"
    }