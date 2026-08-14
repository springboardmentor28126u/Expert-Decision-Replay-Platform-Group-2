"""
app/celery_app.py – Celery application factory for EDRP.

Workers are started by docker-compose via:
    celery -A app.celery_app worker --loglevel=info
Beat scheduler (periodic tasks) is started via:
    celery -A app.celery_app beat  --loglevel=info

Add tasks in app/tasks/*.py and import them here so Celery auto-discovers them.
"""
import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "edrp",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        # Register task modules here – example:
        # "app.tasks.notifications",
        # "app.tasks.escalation",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Periodic tasks (Celery Beat) – uncomment and extend as needed:
    # beat_schedule={
    #     "escalate-overdue-decisions": {
    #         "task": "app.tasks.escalation.escalate_overdue",
    #         "schedule": crontab(minute="*/30"),   # every 30 min
    #     },
    # },
)

# Alias so `celery -A app.celery_app` resolves correctly
app = celery_app
