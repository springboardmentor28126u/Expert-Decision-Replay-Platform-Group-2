import os
import logging
import redis
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class RedisClient:
    _instance = None
    _client = None
    _is_connected = False

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(RedisClient, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def initialize(self):
        """Initialize the connection pool and client."""
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            logger.warning("REDIS_URL env var not found. Redis will be disabled.")
            self._client = None
            self._is_connected = False
            return

        try:
            # Create connection pool
            # Use decode_responses=True so that we get strings instead of bytes
            # Set socket timeouts to prevent hanging if connection fails
            self._client = redis.Redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0,
                retry_on_timeout=True
            )
            # Test connection
            self._client.ping()
            self._is_connected = True
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis at {redis_url}: {e}. Falling back to in-memory mode.")
            self._client = None
            self._is_connected = False

    @property
    def client(self) -> redis.Redis | None:
        if self._client is None and not self._is_connected:
            # Try to initialize if not done yet
            self.initialize()
        return self._client

    @property
    def is_available(self) -> bool:
        if self._client is None:
            self.initialize()
        return self._is_connected

# Create singleton instance helper
redis_helper = RedisClient()

def get_redis() -> redis.Redis | None:
    if redis_helper.is_available:
        return redis_helper.client
    return None
