import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import redis.asyncio as redis
from redis.asyncio.client import Redis

from src.core.config import get_settings
from src.core.exceptions import ConfigurationError, RateLimitExceededError
from src.core.utils import generate_hash

settings = get_settings()


class RedisService:
    """Service for Redis operations including rate limiting and caching"""

    def __init__(self) -> None:
        self.redis: Optional[Redis] = None
        self._connect()

    def _connect(self) -> None:
        """Establish Redis connection"""
        try:
            self.redis = redis.from_url(str(settings.REDIS_URI))
        except Exception as e:
            raise ConfigurationError(
                message="Failed to connect to Redis",
                parameter="REDIS_URI",
                details=str(e),
            )

    async def close(self) -> None:
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()

    async def check_rate_limit(
        self,
        tenant_id: str,
        key: str,
        limit: int,
        period: int,
    ) -> bool:
        """
        Check if rate limit is exceeded

        Args:
            tenant_id: Tenant identifier
            key: Rate limit key (e.g., 'api_calls', 'model_specific')
            limit: Maximum number of requests
            period: Time period in seconds

        Returns:
            bool: True if limit is not exceeded, False otherwise

        Raises:
            RateLimitExceededError: If rate limit is exceeded
        """
        redis_key = f"rate_limit:{tenant_id}:{key}"

        # Get current count and TTL
        async with self.redis.pipeline() as pipe:
            pipe.get(redis_key)
            pipe.ttl(redis_key)
            count, ttl = await pipe.execute()

        if count is None:
            # Initialize rate limit
            await self.redis.setex(redis_key, period, 1)
            return True

        current_count = int(count)
        if current_count >= limit:
            raise RateLimitExceededError(
                message=f"Rate limit exceeded for {key}", retry_after=ttl
            )

        # Increment counter
        await self.redis.incr(redis_key)
        return True

    async def update_token_quota(
        self, tenant_id: str, user_id: str, tokens: int
    ) -> Dict[str, int]:
        """
        Update token usage quota for tenant and user

        Args:
            tenant_id: Tenant identifier
            user_id: User identifier
            tokens: Number of tokens to add to usage

        Returns:
            Dict containing current usage for tenant and user
        """
        tenant_key = f"token_quota:{tenant_id}"
        user_key = f"token_quota:{tenant_id}:{user_id}"

        async with self.redis.pipeline() as pipe:
            # Increment tenant and user quotas
            pipe.incrby(tenant_key, tokens)
            pipe.incrby(user_key, tokens)
            tenant_usage, user_usage = await pipe.execute()

        return {"tenant_usage": int(tenant_usage), "user_usage": int(user_usage)}

    async def get_token_usage(
        self, tenant_id: str, user_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Get current token usage for tenant and optionally user

        Args:
            tenant_id: Tenant identifier
            user_id: Optional user identifier

        Returns:
            Dict containing current usage
        """
        tenant_key = f"token_quota:{tenant_id}"
        tenant_usage = await self.redis.get(tenant_key)

        result = {"tenant_usage": int(tenant_usage or 0)}

        if user_id:
            user_key = f"token_quota:{tenant_id}:{user_id}"
            user_usage = await self.redis.get(user_key)
            result["user_usage"] = int(user_usage or 0)

        return result

    async def cache_response(
        self,
        tenant_id: str,
        request_data: Dict[str, Any],
        response_data: Dict[str, Any],
        ttl: int = 3600,
    ) -> str:
        """
        Cache API response

        Args:
            tenant_id: Tenant identifier
            request_data: Request data to generate cache key
            response_data: Response data to cache
            ttl: Cache TTL in seconds (default: 1 hour)

        Returns:
            Cache key hash
        """
        cache_key = generate_hash({"tenant_id": tenant_id, "request": request_data})

        cache_data = {
            "response": response_data,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(seconds=ttl)).isoformat(),
        }

        await self.redis.setex(f"cache:{cache_key}", ttl, json.dumps(cache_data))

        return cache_key

    async def get_cached_response(
        self, tenant_id: str, request_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached API response

        Args:
            tenant_id: Tenant identifier
            request_data: Request data to generate cache key

        Returns:
            Cached response data if found, None otherwise
        """
        cache_key = generate_hash({"tenant_id": tenant_id, "request": request_data})

        cached = await self.redis.get(f"cache:{cache_key}")
        if not cached:
            return None

        cache_data = json.loads(cached)
        return cache_data["response"]

    async def set_webhook_status(
        self, webhook_id: str, status: str, ttl: int = 300
    ) -> None:
        """
        Set webhook delivery status

        Args:
            webhook_id: Webhook identifier
            status: Status string ('success', 'failed', 'pending')
            ttl: Status TTL in seconds (default: 5 minutes)
        """
        await self.redis.setex(f"webhook_status:{webhook_id}", ttl, status)

    async def get_webhook_status(self, webhook_id: str) -> Optional[str]:
        """
        Get webhook delivery status

        Args:
            webhook_id: Webhook identifier

        Returns:
            Status string if found, None otherwise
        """
        status = await self.redis.get(f"webhook_status:{webhook_id}")
        return status.decode() if status else None


# Global Redis service instance
redis_service: Optional[RedisService] = None


async def get_redis() -> RedisService:
    """Get Redis service instance"""
    global redis_service
    if redis_service is None:
        redis_service = RedisService()
    return redis_service


async def close_redis() -> None:
    """Close Redis connection"""
    global redis_service
    if redis_service:
        await redis_service.close()
        redis_service = None
