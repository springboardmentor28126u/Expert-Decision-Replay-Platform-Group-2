import pytest
import time
from redis_client import get_redis, redis_helper
from redis_cache import (
    get_cached_data,
    set_cached_data,
    delete_cached_data,
    invalidate_decisions_cache,
    invalidate_dashboard_cache,
)

def test_redis_connection():
    """Verify that Redis connection is available and ping succeeds."""
    assert redis_helper.is_available is True
    r = get_redis()
    assert r is not None
    assert r.ping() is True

def test_caching_helpers():
    """Verify basic set, get, and delete operations in redis_cache."""
    key = "test_cache_key"
    data = {"hello": "world", "number": 42, "bool": True}
    
    # Clean up before
    delete_cached_data(key)
    
    # Get before set (should be None)
    assert get_cached_data(key) is None
    
    # Set cache with 10s TTL
    set_cached_data(key, data, expire=10)
    
    # Get cache (should retrieve data)
    retrieved = get_cached_data(key)
    assert retrieved == data
    
    # Delete cache
    delete_cached_data(key)
    assert get_cached_data(key) is None

def test_cache_invalidation():
    """Verify decision and dashboard invalidation methods work."""
    decision_id = 999
    decision_key = f"db_cache:decision:{decision_id}"
    list_key = "db_cache:decisions:all"
    dashboard_key = "dashboard:manager"
    
    # Set dummy data
    set_cached_data(decision_key, {"title": "Decision 999"}, expire=60)
    set_cached_data(list_key, [{"title": "Decision 999"}], expire=60)
    set_cached_data(dashboard_key, {"total_decisions": 1}, expire=60)
    
    # Verify all are set
    assert get_cached_data(decision_key) is not None
    assert get_cached_data(list_key) is not None
    assert get_cached_data(dashboard_key) is not None
    
    # Call invalidate
    invalidate_decisions_cache(decision_id)
    
    # Verify decision, list and dashboard keys are deleted
    assert get_cached_data(decision_key) is None
    assert get_cached_data(list_key) is None
    assert get_cached_data(dashboard_key) is None
