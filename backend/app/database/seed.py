"""
Expert Decision Replay Platform - Database Seed

Seeds the database with predefined roles and a default admin user.
Idempotent — safe to run multiple times.
"""

import logging
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.decision_category import DecisionCategory
from app.core.security import hash_password

logger = logging.getLogger("expert_decision")

# Predefined roles matching the PRD's RBAC matrix (Section 3)
PREDEFINED_ROLES = [
    {
        "name": "Employee",
        "description": "Creates and manages own decisions. Can comment, view assigned reviews, and view org-wide approved decisions (read-only).",
    },
    {
        "name": "Reviewer",
        "description": "Assigned to evaluate a decision at one approval stage. Can comment, approve/reject, and request more info.",
    },
    {
        "name": "Manager",
        "description": "Owns team decisions, approves at manager level, views team analytics and reports.",
    },
    {
        "name": "Administrator",
        "description": "System owner with full access: user/role/team management, system configuration, audit logs, org-wide analytics.",
    },
]

DEFAULT_ADMIN = {
    "full_name": "System Administrator",
    "email": "admin@edrp.local",
    "password": "Admin@123",
}

# Default decision categories
DEFAULT_CATEGORIES = [
    {"name": "Technology", "description": "Technology stack, tools, infrastructure, and IT decisions."},
    {"name": "Finance", "description": "Budget allocation, investments, cost optimization, and financial planning."},
    {"name": "HR", "description": "Hiring, policies, training, compensation, and organizational structure."},
    {"name": "Operations", "description": "Process improvements, logistics, supply chain, and operational efficiency."},
    {"name": "Strategy", "description": "Business strategy, market positioning, partnerships, and long-term planning."},
    {"name": "Marketing", "description": "Campaigns, branding, customer engagement, and market research."},
    {"name": "Legal", "description": "Compliance, contracts, intellectual property, and regulatory decisions."},
]


def seed_roles(db: Session) -> dict:
    """Create predefined roles if they don't exist. Returns a name->Role mapping."""
    role_map = {}
    for role_data in PREDEFINED_ROLES:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if existing:
            role_map[existing.name] = existing
            logger.debug("Role '%s' already exists — skipping.", role_data["name"])
        else:
            new_role = Role(**role_data)
            db.add(new_role)
            db.flush()
            role_map[new_role.name] = new_role
            logger.info("Created role: %s", role_data["name"])
    return role_map


def seed_admin(db: Session, role_map: dict) -> None:
    """Create a default admin user if no users exist at all."""
    user_count = db.query(User).count()
    if user_count > 0:
        logger.debug("Users already exist (%d) — skipping admin seed.", user_count)
        return

    admin_role = role_map.get("Administrator")
    if not admin_role:
        logger.error("Administrator role not found — cannot seed admin user.")
        return

    admin_user = User(
        full_name=DEFAULT_ADMIN["full_name"],
        email=DEFAULT_ADMIN["email"],
        password_hash=hash_password(DEFAULT_ADMIN["password"]),
        role_id=admin_role.id,
    )
    db.add(admin_user)
    db.flush()

    # Create empty profile
    profile = UserProfile(user_id=admin_user.id)
    db.add(profile)

    logger.info(
        "Created default admin: %s (password: %s)",
        DEFAULT_ADMIN["email"],
        DEFAULT_ADMIN["password"],
    )


def seed_categories(db: Session) -> None:
    """Create default decision categories if they don't exist."""
    for cat_data in DEFAULT_CATEGORIES:
        existing = db.query(DecisionCategory).filter(DecisionCategory.name == cat_data["name"]).first()
        if existing:
            logger.debug("Category '%s' already exists — skipping.", cat_data["name"])
        else:
            new_cat = DecisionCategory(**cat_data)
            db.add(new_cat)
            logger.info("Created category: %s", cat_data["name"])


def run_seed() -> None:
    """Execute all seed operations inside a single transaction."""
    db = SessionLocal()
    try:
        role_map = seed_roles(db)
        seed_admin(db, role_map)
        seed_categories(db)
        db.commit()
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error("Database seeding failed: %s", e)
        raise
    finally:
        db.close()
