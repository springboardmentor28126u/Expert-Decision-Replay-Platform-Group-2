from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.database.session import engine, Base
from app.routers import auth, users, decisions


# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables on startup
# This acts as an automatic setup fallback if migrations haven't run
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    
    # Seed default categories
    from app.database.session import SessionLocal
    from app.models.decision import Category
    db = SessionLocal()
    try:
        default_categories = [
            {"name": "Technology", "description": "Software, systems, infrastructure, and tools decisions."},
            {"name": "Finance", "description": "Budgets, procurement, tool subscriptions, and capital expenses."},
            {"name": "HR", "description": "Hiring, onboarding, roles structure, and staffing plans."},
            {"name": "Operations", "description": "Process improvements, timelines, and organizational routines."},
            {"name": "Marketing", "description": "Branding, campaign strategies, and customer engagement decisions."}
        ]
        for cat in default_categories:
            existing = db.query(Category).filter(Category.name == cat["name"]).first()
            if not existing:
                new_cat = Category(name=cat["name"], description=cat["description"])
                db.add(new_cat)
        db.commit()
        logger.info("Default categories seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for managing expert organizational decisions.",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the administrator."},
    )

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(decisions.router)


@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": "1.0.0"
    }
