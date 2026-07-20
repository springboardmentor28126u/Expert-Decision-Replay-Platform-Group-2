"""Global error handling middleware."""

import logging
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

logger = logging.getLogger(__name__)


async def error_handler_middleware(request: Request, call_next: Callable) -> Response:
    """Global error handler that catches unhandled exceptions.

    Converts database and unexpected errors into clean JSON responses.
    """
    try:
        response = await call_next(request)
        return response
    except IntegrityError as exc:
        logger.error(f"Database integrity error: {exc}")
        return JSONResponse(
            status_code=409,
            content={"detail": "A database constraint was violated. The resource may already exist."},
        )
    except OperationalError as exc:
        logger.error(f"Database operational error: {exc}")
        return JSONResponse(
            status_code=503,
            content={"detail": "Database connection error. Please try again later."},
        )
    except Exception as exc:
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred."},
        )
