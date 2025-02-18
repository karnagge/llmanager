from datetime import datetime
from typing import Dict, List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from src.core.auth import AuthService, check_permissions, get_current_tenant_and_key
from src.core.database import create_tenant_database, get_tenant_db_session
from src.core.exceptions import DatabaseError
from src.core.utils import validate_tenant_config
from src.models.system import APIKey, Tenant, Webhook
from src.models.tenant import UsageLog
from src.schemas import (
    APIKeyCreate,
    APIKeyResponse,
    TenantCreate,
    TenantResponse,
    TenantUpdate,
    WebhookCreate,
    WebhookResponse,
    WebhookUpdate,
)

router = APIRouter()


# Tenant Routes
@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:create_tenant"})),
) -> TenantResponse:
    """Create a new tenant"""
    errors = validate_tenant_config(tenant_data.config)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    tenant_id = str(uuid4())

    try:
        # Create tenant database
        await create_tenant_database(tenant_id)

        async with get_tenant_db_session("system") as session:
            # Create tenant record
            tenant = Tenant(
                id=tenant_id,
                name=tenant_data.name,
                quota_limit=tenant_data.quota_limit,
                config=tenant_data.config,
            )
            session.add(tenant)
            await session.commit()

            return TenantResponse.model_validate(tenant)

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants", response_model=List[TenantResponse])
async def list_tenants(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_tenant"})),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[TenantResponse]:
    """List all tenants"""
    async with get_tenant_db_session("system") as session:
        result = await session.execute(select(Tenant).offset(offset).limit(limit))
        tenants = result.scalars().all()
        return [TenantResponse.model_validate(t) for t in tenants]


@router.put("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    update_data: TenantUpdate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:update_tenant"})),
) -> TenantResponse:
    """Update a tenant"""
    if update_data.config:
        errors = validate_tenant_config(update_data.config)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

    async with get_tenant_db_session("system") as session:
        tenant = await session.get(Tenant, tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        # Update fields
        if update_data.name is not None:
            tenant.name = update_data.name
        if update_data.quota_limit is not None:
            tenant.quota_limit = update_data.quota_limit
        if update_data.is_active is not None:
            tenant.is_active = update_data.is_active
        if update_data.config is not None:
            tenant.config = update_data.config

        await session.commit()
        return TenantResponse.model_validate(tenant)


# API Key Routes
@router.post("/tenants/{tenant_id}/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    tenant_id: str,
    key_data: APIKeyCreate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:create_api_key"})),
) -> APIKeyResponse:
    """Create a new API key for a tenant"""
    async with get_tenant_db_session("system") as session:
        # Generate API key
        key = AuthService.create_api_key()
        key_hash = AuthService.hash_api_key(key)

        # Create API key record
        api_key = APIKey(
            id=str(uuid4()),
            tenant_id=tenant_id,
            name=key_data.name,
            key_hash=key_hash,
            permissions=key_data.permissions,
            expires_at=key_data.expires_at,
        )
        session.add(api_key)
        await session.commit()

        response = APIKeyResponse.model_validate(api_key)
        response.key = key  # Include raw key in response
        return response


# Webhook Routes
@router.post("/tenants/{tenant_id}/webhooks", response_model=WebhookResponse)
async def create_webhook(
    tenant_id: str,
    webhook_data: WebhookCreate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:create_webhook"})),
) -> WebhookResponse:
    """Create a new webhook for a tenant"""
    async with get_tenant_db_session("system") as session:
        webhook = Webhook(
            id=str(uuid4()),
            tenant_id=tenant_id,
            url=webhook_data.url,
            secret=str(uuid4()),  # Generate webhook secret
            events=webhook_data.events,
            metadata=webhook_data.metadata,
        )
        session.add(webhook)
        await session.commit()
        return WebhookResponse.model_validate(webhook)


@router.get("/tenants/{tenant_id}/webhooks", response_model=List[WebhookResponse])
async def list_webhooks(
    tenant_id: str,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_webhook"})),
) -> List[WebhookResponse]:
    """List all webhooks for a tenant"""
    async with get_tenant_db_session("system") as session:
        result = await session.execute(
            select(Webhook).where(Webhook.tenant_id == tenant_id)
        )
        webhooks = result.scalars().all()
        return [WebhookResponse.model_validate(w) for w in webhooks]


@router.put(
    "/tenants/{tenant_id}/webhooks/{webhook_id}", response_model=WebhookResponse
)
async def update_webhook(
    tenant_id: str,
    webhook_id: str,
    webhook_data: WebhookUpdate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:update_webhook"})),
) -> WebhookResponse:
    """Update a webhook"""
    async with get_tenant_db_session("system") as session:
        webhook = await session.get(Webhook, webhook_id)
        if not webhook or webhook.tenant_id != tenant_id:
            raise HTTPException(status_code=404, detail="Webhook not found")

        # Update fields
        if webhook_data.url is not None:
            webhook.url = webhook_data.url
        if webhook_data.events is not None:
            webhook.events = webhook_data.events
        if webhook_data.is_active is not None:
            webhook.is_active = webhook_data.is_active
        if webhook_data.metadata is not None:
            webhook.metadata = webhook_data.metadata

        await session.commit()
        return WebhookResponse.model_validate(webhook)


# Usage Statistics Routes
@router.get("/tenants/{tenant_id}/usage")
async def get_tenant_usage(
    tenant_id: str,
    start_date: datetime,
    end_date: datetime,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_usage"})),
) -> Dict:
    """Get token usage statistics for a tenant"""
    async with get_tenant_db_session(tenant_id) as session:
        # Get usage logs for the period
        result = await session.execute(
            select(UsageLog).where(
                UsageLog.timestamp >= start_date, UsageLog.timestamp <= end_date
            )
        )
        logs = result.scalars().all()

        # Calculate statistics
        total_tokens = sum(log.total_tokens for log in logs)
        total_cost = sum(log.cost for log in logs)

        usage_by_model = {}
        for log in logs:
            if log.model not in usage_by_model:
                usage_by_model[log.model] = {"total_tokens": 0, "cost": 0}
            usage_by_model[log.model]["total_tokens"] += log.total_tokens
            usage_by_model[log.model]["cost"] += log.cost

        return {
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "usage_by_model": usage_by_model,
        }
