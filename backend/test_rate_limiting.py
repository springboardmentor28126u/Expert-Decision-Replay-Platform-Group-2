import os
import sys
import pytest
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

# We can import RateLimitingMiddleware from main since we've added it there
from main import RateLimitingMiddleware

def test_rate_limiting_under_limit():
    # Create a fresh app to isolate test state
    app = FastAPI()
    app.add_middleware(RateLimitingMiddleware, limit=3, window=60)
    
    @app.get("/")
    def index():
        return {"ok": True}
        
    client = TestClient(app)
    
    # 3 requests should all succeed
    for _ in range(3):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"ok": True}

def test_rate_limiting_exceeded():
    app = FastAPI()
    app.add_middleware(RateLimitingMiddleware, limit=3, window=60)
    
    @app.get("/")
    def index():
        return {"ok": True}
        
    client = TestClient(app)
    
    # First 3 requests succeed
    for _ in range(3):
        response = client.get("/")
        assert response.status_code == 200
        
    # 4th request should fail with 429
    response = client.get("/")
    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests. Please try again later."}

def test_rate_limiting_disabled_when_limit_zero():
    app = FastAPI()
    app.add_middleware(RateLimitingMiddleware, limit=0, window=60)
    
    @app.get("/")
    def index():
        return {"ok": True}
        
    client = TestClient(app)
    
    # 10 requests should all succeed because limit <= 0 disables it
    for _ in range(10):
        response = client.get("/")
        assert response.status_code == 200

def test_rate_limiting_env_var_config():
    # Unload main module if it's already loaded to force reload with patched env var
    if 'main' in sys.modules:
        del sys.modules['main']
        
    with patch.dict(os.environ, {"RATE_LIMIT_PER_MIN": "123"}):
        import main
        # Find the RateLimitingMiddleware in app middleware stack
        limiter_middleware = None
        for middleware in main.app.user_middleware:
            if middleware.cls == main.RateLimitingMiddleware:
                limiter_middleware = middleware
                break
        
        assert limiter_middleware is not None
        assert limiter_middleware.kwargs["limit"] == 123


    # Clean up and reload main again to ensure default configuration is restored for subsequent tests
    if 'main' in sys.modules:
        del sys.modules['main']


def test_rate_limiting_authenticated():
    from auth import SECRET_KEY, ALGORITHM
    from jose import jwt
    
    app = FastAPI()
    app.add_middleware(RateLimitingMiddleware, limit=3, window=60)
    
    @app.get("/")
    def index():
        return {"ok": True}
        
    client = TestClient(app)
    
    # Create tokens for two different users
    token1 = jwt.encode({"sub": "user1@example.com"}, SECRET_KEY, algorithm=ALGORITHM)
    token2 = jwt.encode({"sub": "user2@example.com"}, SECRET_KEY, algorithm=ALGORITHM)
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 1 hits the rate limit (3 requests)
    for _ in range(3):
        response = client.get("/", headers=headers1)
        assert response.status_code == 200
        
    # User 1 is rate limited (4th request)
    response = client.get("/", headers=headers1)
    assert response.status_code == 429
    assert response.json() == {"detail": "Too many requests. Please try again later."}
    
    # User 2 is NOT rate limited because they are a different user
    response = client.get("/", headers=headers2)
    assert response.status_code == 200
    
    # Unauthenticated client (IP fallback) is NOT rate limited
    response = client.get("/")
    assert response.status_code == 200

