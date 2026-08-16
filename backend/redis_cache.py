import json
import logging
from typing import Any, Optional
from redis_client import get_redis

logger = logging.getLogger(__name__)

CACHE_EXPIRE_SECONDS = 300  # Default 5 minutes expiration

def get_cached_data(key: str) -> Optional[Any]:
    """Retrieve and parse JSON data from Redis cache."""
    try:
        r = get_redis()
        if r is not None:
            data = r.get(key)
            if data:
                return json.loads(data)
    except Exception as e:
        logger.error(f"Error reading from Redis cache (key={key}): {e}")
    return None

def set_cached_data(key: str, data: Any, expire: int = CACHE_EXPIRE_SECONDS) -> None:
    """Serialize and store data in Redis cache with an expiration."""
    try:
        r = get_redis()
        if r is not None:
            r.set(key, json.dumps(data, default=str), ex=expire)
    except Exception as e:
        logger.error(f"Error writing to Redis cache (key={key}): {e}")

def delete_cached_data(key: str) -> None:
    """Delete a single key from Redis cache."""
    try:
        r = get_redis()
        if r is not None:
            r.delete(key)
    except Exception as e:
        logger.error(f"Error deleting from Redis cache (key={key}): {e}")

def invalidate_decisions_cache(decision_id: Optional[int] = None) -> None:
    """
    Invalidate decision list caches and optionally a specific decision cache.
    Also automatically invalidates all dashboard caches because dashboard numbers
    change whenever a decision is created, updated, or deleted.
    """
    try:
        r = get_redis()
        if r is None:
            return

        # 1. Invalidate specific decision cache if decision_id is provided
        if decision_id is not None:
            r.delete(f"db_cache:decision:{decision_id}")

        # 2. Invalidate all query lists of decisions
        # Find all keys starting with db_cache:decisions:
        decision_keys = r.keys("db_cache:decisions:*")
        if decision_keys:
            r.delete(*decision_keys)

        # 3. Invalidate dashboard stats
        invalidate_dashboard_cache()

    except Exception as e:
        logger.error(f"Error invalidating decisions cache: {e}")

def invalidate_dashboard_cache() -> None:
    """Invalidate all dashboard statistics caches."""
    try:
        r = get_redis()
        if r is not None:
            dashboard_keys = r.keys("dashboard:*")
            if dashboard_keys:
                r.delete(*dashboard_keys)
    except Exception as e:
        logger.error(f"Error invalidating dashboard caches: {e}")

def invalidate_admin_dashboard_cache() -> None:
    """Invalidate only the admin dashboard statistics cache."""
    try:
        r = get_redis()
        if r is not None:
            r.delete("dashboard:admin")
    except Exception as e:
        logger.error(f"Error invalidating admin dashboard cache: {e}")
