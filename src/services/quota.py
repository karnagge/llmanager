import json
import uuid
from typing import Dict, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.database import get_tenant_db_session
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
        """Check if requested tokens are within quota limits"""
        try:
            # Get tenant from system database
            tenant = await session.get(Tenant, tenant_id)
            if not tenant:
                logger.error("tenant_not_found", tenant_id=tenant_id)
                raise ValueError(f"Tenant not found: {tenant_id}")

            # Get user from tenant database
            async with get_tenant_db_session(tenant_id) as tenant_session:
                user = await tenant_session.get(User, user_id)
                if not user:
                    logger.error("user_not_found", user_id=user_id, tenant_id=tenant_id)
                    raise ValueError(f"User not found: {user_id}")

                # Get current usage from Redis
                redis = await get_redis()
                usage = await redis.get_token_usage(tenant_id, user_id)

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

        except SQLAlchemyError as e:
            logger.error(
                "database_error",
                error=str(e),
                tenant_id=tenant_id,
                user_id=user_id,
                operation="check_quota",
            )
            raise

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
        """Update token usage for tenant and user"""
        try:
            total_tokens = prompt_tokens + completion_tokens
            cost = calculate_token_cost(prompt_tokens, completion_tokens, model)

            logger.debug(
                "updating_usage",
                tenant_id=tenant_id,
                user_id=user_id,
                total_tokens=total_tokens,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

            # First update Redis counters
            redis = await get_redis()
            new_usage = await redis.update_token_quota(tenant_id, user_id, total_tokens)

            # Update tenant quota in system database
            tenant = await session.get(Tenant, tenant_id)
            if not tenant:
                logger.error("tenant_not_found_update", tenant_id=tenant_id)
                raise ValueError(f"Tenant not found: {tenant_id}")

            tenant.current_quota_usage = new_usage["tenant_usage"]
            await session.commit()
            logger.debug(
                "tenant_quota_updated",
                tenant_id=tenant_id,
                current_usage=new_usage["tenant_usage"],
            )

            # Update user quota and usage log in tenant database
            async with get_tenant_db_session(tenant_id) as tenant_session:
                user = await tenant_session.get(User, user_id)
                if not user:
                    logger.error(
                        "user_not_found_update", user_id=user_id, tenant_id=tenant_id
                    )
                    raise ValueError(f"User not found: {user_id}")

                # Update user's quota usage
                user.current_quota_usage = new_usage["user_usage"]

                # Create usage log entry
                # Create usage log with unique ID
                usage_log = UsageLog(
                    id=str(uuid.uuid4()),  # Generate unique ID for primary key
                    user_id=user_id,
                    request_id=request_id,  # Use the provided request ID
                    model=model,
                    provider=metadata.get("provider", "openai"),  # Default to openai if not specified
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    cost=cost,
                    usage_data=metadata or {},  # Store complete metadata
                )
                tenant_session.add(usage_log)

                # Save user updates and usage log
                await tenant_session.commit()
                logger.debug(
                    "user_quota_updated",
                    tenant_id=tenant_id,
                    user_id=user_id,
                    current_usage=new_usage["user_usage"],
                    total_tokens=total_tokens,
                )

            # Check threshold without transaction
            usage_percentage = (new_usage["tenant_usage"] / tenant.quota_limit) * 100
            if usage_percentage >= settings.TOKEN_QUOTA_ALERT_THRESHOLD * 100:
                await self._notify_quota_threshold(
                    tenant_id=tenant_id,
                    quota_limit=tenant.quota_limit,
                    current_usage=new_usage["tenant_usage"],
                    usage_percentage=usage_percentage,
                )

        except SQLAlchemyError as e:
            logger.error(
                "database_error",
                error=str(e),
                tenant_id=tenant_id,
                user_id=user_id,
                operation="update_usage",
            )
            raise

    async def _notify_quota_threshold(
        self,
        tenant_id: str,
        quota_limit: int,
        current_usage: int,
        usage_percentage: float,
    ) -> None:
        """Send notifications when quota threshold is reached"""
        try:
            # Get webhooks using system database
            async with get_tenant_db_session("system") as session:
                result = await session.execute(
                    select(Webhook).where(
                        Webhook.tenant_id == tenant_id,
                        Webhook.is_active == True,
                        Webhook.events.contains(["quota_threshold"]),
                    )
                )
                webhooks = result.scalars().all()

                for webhook in webhooks:
                    try:
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
                    except Exception as e:
                        logger.error(
                            "webhook_notification_failed",
                            webhook_id=webhook.id,
                            tenant_id=tenant_id,
                            error=str(e),
                        )

        except Exception as e:
            logger.error(
                "quota_notification_error",
                error=str(e),
                tenant_id=tenant_id,
            )

    async def _send_webhook_notification(
        self, webhook: Webhook, event_type: str, data: Dict
    ) -> None:
        """Send webhook notification"""
        payload = format_webhook_payload(event_type, data)
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
                            await redis.set_webhook_status(webhook.id, "failed")
                            raise WebhookDeliveryError(
                                webhook_id=webhook.id, attempts=attempt + 1
                            )

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
