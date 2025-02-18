import json
from typing import Dict, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.exceptions import QuotaExceededError, WebhookDeliveryError
from src.core.logging import get_logger
from src.core.redis import get_redis
from src.core.utils import calculate_token_cost, format_webhook_payload
from src.models.system import Tenant, Webhook
from src.models.tenant import UsageLog, User

settings = get_settings()
logger = get_logger(__name__)


class QuotaService:
    """Service for managing token quotas and usage tracking"""

    async def check_quota(
        self, tenant_id: str, user_id: str, requested_tokens: int, session: AsyncSession
    ) -> None:
        """
        Check if requested tokens are within quota limits

        Args:
            tenant_id: Tenant identifier
            user_id: User identifier
            requested_tokens: Number of tokens being requested
            session: Database session

        Raises:
            QuotaExceededError: If quota would be exceeded
        """
        # Get current usage from Redis
        redis = await get_redis()
        usage = await redis.get_token_usage(tenant_id, user_id)

        # Get tenant and user quota limits
        tenant = await session.get(Tenant, tenant_id)
        user = await session.get(User, user_id)

        # Check tenant quota
        tenant_usage = usage["tenant_usage"]
        if tenant_usage + requested_tokens > tenant.quota_limit:
            raise QuotaExceededError(
                message="Tenant token quota exceeded",
                quota_limit=tenant.quota_limit,
                current_usage=tenant_usage,
            )

        # Check user quota if exists and set
        user_usage = usage.get("user_usage", 0)
        if user and user.quota_limit is not None:
            if user_usage + requested_tokens > user.quota_limit:
                raise QuotaExceededError(
                    message="User token quota exceeded",
                    quota_limit=user.quota_limit,
                    current_usage=user_usage,
                )

    async def update_usage(
        self,
        tenant_id: str,
        user_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
        request_id: str,
        metadata: Optional[Dict] = None,
        session: AsyncSession = None,
    ) -> None:
        """
        Update token usage for tenant and user

        Args:
            tenant_id: Tenant identifier
            user_id: User identifier
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
            model: Model identifier
            request_id: Request identifier
            metadata: Optional metadata about the request
            session: Database session
        """
        total_tokens = prompt_tokens + completion_tokens
        cost = calculate_token_cost(prompt_tokens, completion_tokens, model)

        # Update Redis usage counters
        redis = await get_redis()
        new_usage = await redis.update_token_quota(tenant_id, user_id, total_tokens)

        # Create usage log entry
        usage_log = UsageLog(
            id=request_id,
            user_id=user_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=cost,
            metadata=metadata or {},
        )
        session.add(usage_log)

        # Update tenant usage in database
        tenant = await session.get(Tenant, tenant_id)
        tenant.current_quota_usage = new_usage["tenant_usage"]

        # Update user usage in database
        user = await session.get(User, user_id)
        user.current_quota_usage = new_usage["user_usage"]

        await session.commit()

        # Check if quota threshold is reached and notify
        await self._check_quota_threshold(
            tenant_id, tenant.quota_limit, new_usage["tenant_usage"], session
        )

    async def _check_quota_threshold(
        self,
        tenant_id: str,
        quota_limit: int,
        current_usage: int,
        session: AsyncSession,
    ) -> None:
        """Check if quota threshold is reached and send notifications"""
        usage_percentage = (current_usage / quota_limit) * 100

        if usage_percentage >= settings.TOKEN_QUOTA_ALERT_THRESHOLD * 100:
            # Get tenant's webhooks
            result = await session.execute(
                select(Webhook).where(
                    Webhook.tenant_id == tenant_id,
                    Webhook.is_active == True,
                    Webhook.events.contains(["quota_threshold"]),
                )
            )
            webhooks = result.scalars().all()

            # Send notifications
            for webhook in webhooks:
                await self._send_webhook_notification(
                    webhook,
                    "quota_threshold_reached",
                    {
                        "tenant_id": tenant_id,
                        "quota_limit": quota_limit,
                        "current_usage": current_usage,
                        "usage_percentage": usage_percentage,
                    },
                )

    async def _send_webhook_notification(
        self, webhook: Webhook, event_type: str, data: Dict
    ) -> None:
        """Send webhook notification"""
        payload = format_webhook_payload(event_type, data)

        # Get Redis for webhook status tracking
        redis = await get_redis()

        try:
            async with httpx.AsyncClient() as client:
                for attempt in range(settings.WEBHOOK_RETRY_ATTEMPTS):
                    try:
                        response = await client.post(
                            webhook.url,
                            json=payload,
                            headers={
                                "Content-Type": "application/json",
                                "X-Webhook-Signature": self._sign_payload(
                                    payload, webhook.secret
                                ),
                            },
                            timeout=10.0,
                        )
                        response.raise_for_status()

                        # Success - update status and break
                        await redis.set_webhook_status(webhook.id, "success")
                        break

                    except httpx.HTTPError as e:
                        logger.warning(
                            "webhook_delivery_failed",
                            webhook_id=webhook.id,
                            attempt=attempt + 1,
                            error=str(e),
                        )

                        if attempt == settings.WEBHOOK_RETRY_ATTEMPTS - 1:
                            # Final attempt failed
                            await redis.set_webhook_status(webhook.id, "failed")
                            raise WebhookDeliveryError(
                                webhook_id=webhook.id, attempts=attempt + 1
                            )

                        # Update status and wait before retry
                        await redis.set_webhook_status(webhook.id, "pending")
                        await httpx.AsyncClient.sleep(settings.WEBHOOK_RETRY_DELAY)

        except Exception as e:
            logger.error("webhook_error", webhook_id=webhook.id, error=str(e))
            raise WebhookDeliveryError(webhook_id=webhook.id, attempts=0)

    def _sign_payload(self, payload: Dict, secret: str) -> str:
        """Generate signature for webhook payload"""
        import hashlib
        import hmac

        payload_str = json.dumps(payload, sort_keys=True)
        return hmac.new(
            secret.encode(), payload_str.encode(), hashlib.sha256
        ).hexdigest()


# Global quota service instance
quota_service: Optional[QuotaService] = None


async def get_quota_service() -> QuotaService:
    """Get quota service instance"""
    global quota_service
    if quota_service is None:
        quota_service = QuotaService()
    return quota_service
