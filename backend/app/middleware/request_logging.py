"""
Expert Decision Replay Platform - Request Logging Middleware
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"Request: {request.method} {request.url.path} from {client_ip}")
        
        response = await call_next(request)
        
        # Log response
        process_time = (time.time() - start_time) * 1000
        logger.info(f"Response: {response.status_code} for {request.method} {request.url.path} completed in {process_time:.2f}ms")
        
        return response
