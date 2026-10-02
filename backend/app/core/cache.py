import json
import logging
import time
from typing import Any, Optional, Union
import redis
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self):
        self._redis_client: Optional[redis.Redis] = None
        self._memory_cache: dict[str, tuple[Any, float]] = {}
        self._is_redis_available = False
        self._connect_redis()

    def _connect_redis(self):
        try:
            client = redis.Redis.from_url(
                settings.REDIS_URL,
                socket_timeout=1.5,
                socket_connect_timeout=1.5,
                decode_responses=True
            )
            client.ping()
            self._redis_client = client
            self._is_redis_available = True
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            self._is_redis_available = False
            self._redis_client = None
            logger.warning(f"Redis not available ({e}). Using in-memory fallback cache.")

    def get(self, key: str) -> Optional[Any]:
        if self._is_redis_available and self._redis_client:
            try:
                val = self._redis_client.get(key)
                if val is not None:
                    return json.loads(val)
                return None
            except Exception as e:
                logger.warning(f"Redis get failed: {e}. Checking memory cache.")

        # Fallback to memory cache
        if key in self._memory_cache:
            data, expiry = self._memory_cache[key]
            if expiry == 0 or expiry > time.time():
                return data
            else:
                del self._memory_cache[key]
        return None

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> bool:
        serialized = json.dumps(value, default=str)
        success = False
        if self._is_redis_available and self._redis_client:
            try:
                self._redis_client.setex(key, expire_seconds, serialized)
                success = True
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")

        # Always keep in-memory backup
        expiry = time.time() + expire_seconds if expire_seconds > 0 else 0
        self._memory_cache[key] = (value, expiry)
        return success or True

    def delete(self, key: str) -> bool:
        if self._is_redis_available and self._redis_client:
            try:
                self._redis_client.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)
        return True

    def delete_prefix(self, prefix: str) -> bool:
        if self._is_redis_available and self._redis_client:
            try:
                keys = self._redis_client.keys(f"{prefix}*")
                if keys:
                    self._redis_client.delete(*keys)
            except Exception:
                pass
        
        to_del = [k for k in self._memory_cache if k.startswith(prefix)]
        for k in to_del:
            self._memory_cache.pop(k, None)
        return True

    def invalidate_financial_caches(self, group_id: Optional[int] = None):
        """
        Invalidates dashboard statistics, group summaries, and reports after a financial change.
        """
        self.delete_prefix("dashboard:")
        self.delete_prefix("reports:")
        self.delete("groups:summary")
        if group_id:
            self.delete(f"group:{group_id}:balance")
            self.delete(f"group:{group_id}:ledger")
        self.delete_prefix("groups:")


cache = CacheService()
