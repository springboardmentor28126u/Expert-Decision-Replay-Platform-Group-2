"""
Expert Decision Replay Platform - Database Seed

Seeds the database with predefined roles and a default admin user.
Idempotent — safe to run multiple times.
"""

import logging
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.user_profile import UserProfile
from app.models.decision_category import DecisionCategory
from app.core.security import hash_password

logger = logging.getLogger("expert_decision")

DEFAULT_ADMIN = {
    "full_name": "System Administrator",
    "email": "admin@edrp.com",
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
    {"name": "Engineering", "description": "Software engineering, architecture, and infrastructure decisions."},
]

DEMO_USERS = [
    {"full_name": "Alice Johnson", "email": "alice@demo.com", "password": "Demo@123", "role": UserRole.EMPLOYEE},
    {"full_name": "Bob Smith", "email": "bob@demo.com", "password": "Demo@123", "role": UserRole.REVIEWER},
    {"full_name": "Carol Williams", "email": "carol@demo.com", "password": "Demo@123", "role": UserRole.REVIEWER},
    {"full_name": "Dave Brown", "email": "dave@demo.com", "password": "Demo@123", "role": UserRole.MANAGER},
    {"full_name": "Demo Admin", "email": "admin@demo.com", "password": "Demo@123", "role": UserRole.ADMIN},
]


def seed_admin(db: Session) -> None:
    """Create a default admin user and default company if no users exist at all."""
    user_count = db.query(User).count()
    if user_count > 0:
        logger.debug("Users already exist (%d) — skipping admin seed.", user_count)
        return

    from app.models.company import Company
    from app.models.group import Group
    from app.models.membership import Membership, CompanyRole
    from app.models.group_membership import GroupMembership

    admin_user = User(
        full_name=DEFAULT_ADMIN["full_name"],
        email=DEFAULT_ADMIN["email"],
        password_hash=hash_password(DEFAULT_ADMIN["password"]),
        role=UserRole.ADMIN,
    )
    db.add(admin_user)
    db.flush()

    # Create empty profile
    profile = UserProfile(user_id=admin_user.id)
    db.add(profile)

    # Create default company & group
    company = Company(name="Default Company", slug="default-company")
    db.add(company)
    db.flush()

    membership = Membership(
        user_id=admin_user.id,
        company_id=company.id,
        role=CompanyRole.ADMIN,
    )
    db.add(membership)

    group = Group(company_id=company.id, name="Default Group")
    db.add(group)
    db.flush()

    gm = GroupMembership(group_id=group.id, user_id=admin_user.id)
    db.add(gm)

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


def seed_demo_users(db: Session) -> None:
    """Create demo users if they don't exist, linking them to the default company and group."""
    from app.models.company import Company
    from app.models.group import Group
    from app.models.membership import Membership, CompanyRole
    from app.models.group_membership import GroupMembership
    from app.models.user_profile import UserProfile

    default_company = db.query(Company).filter(Company.slug == "default-company").first()
    default_group = db.query(Group).filter(Group.name == "Default Group").first()
    if not default_company or not default_group:
        logger.warning("Default company/group not found — skipping demo user seed.")
        return

    for user_data in DEMO_USERS:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            continue

        user = User(
            full_name=user_data["full_name"],
            email=user_data["email"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
        )
        db.add(user)
        db.flush()

        profile = UserProfile(user_id=user.id)
        db.add(profile)

        membership_role = CompanyRole.ADMIN if user_data["role"] == UserRole.ADMIN else CompanyRole.EMPLOYEE
        membership = Membership(user_id=user.id, company_id=default_company.id, role=membership_role)
        db.add(membership)

        gm = GroupMembership(group_id=default_group.id, user_id=user.id)
        db.add(gm)

        logger.info("Created demo user: %s (%s)", user_data["email"], user_data["role"].value)


def seed_approval_chain(db: Session) -> None:
    """Create approval chain config for Engineering category."""
    from app.models.approval_chain import ApprovalChainConfig

    engineering = db.query(DecisionCategory).filter(DecisionCategory.name == "Engineering").first()
    if not engineering:
        logger.warning("Engineering category not found — skipping approval chain seed.")
        return

    existing = db.query(ApprovalChainConfig).filter(ApprovalChainConfig.category_id == engineering.id).first()
    if existing:
        return

    chain = ApprovalChainConfig(
        category_id=engineering.id,
        roles=["reviewer", "manager"],
        sla_hours=48,
    )
    db.add(chain)
    logger.info("Created approval chain for Engineering: [reviewer, manager]")


def run_seed() -> None:
    """Execute all seed operations inside a single transaction."""
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_categories(db)
        seed_demo_users(db)
        seed_approval_chain(db)
        db.commit()
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error("Database seeding failed: %s", e)
        raise
    finally:
        db.close()
