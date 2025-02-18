# API Key Migration Guide

## Overview

This guide covers the steps needed to migrate from user-based to API key-based identification in request handling. This change:

- Makes the API more RESTful by using API keys for both authentication and identification
- Improves compatibility with OpenAI's API design
- Enables per-API key quota tracking
- Supports multiple API keys per user with individual limits

## Prerequisites

- Access to your PostgreSQL database
- Redis server running
- Python 3.11+
- Poetry for dependency management

## Migration Steps

### 1. Database Migration

First, apply the new database migration that adds user_id and quota fields to API keys:

```bash
# Apply the migration
alembic upgrade head

# If you need to rollback
alembic downgrade -1
```

### 2. Redis Updates

Update your Redis implementation to support per-API key quota tracking.

Create/update `src/core/redis.py`:

```python
from typing import Optional, Dict, Any

class RedisService:
    async def get_token_usage(
        self, 
        tenant_id: str, 
        user_id: str, 
        api_key_id: Optional[str] = None
    ) -> Dict[str, int]:
        """Get token usage for tenant, user, and optionally API key"""
        # Get base usage
        usage = await self.get(f"quota:{tenant_id}:{user_id}")
        
        # Add API key usage if requested
        if api_key_id:
            api_key_usage = await self.get(f"quota:{tenant_id}:{user_id}:{api_key_id}")
            return {
                "tenant_usage": usage.get("tenant_usage", 0),
                "user_usage": usage.get("user_usage", 0),
                "api_key_usage": api_key_usage.get("usage", 0)
            }
        return usage

    async def update_token_quota(
        self,
        tenant_id: str,
        user_id: str,
        tokens: int,
        api_key_id: Optional[str] = None
    ) -> Dict[str, int]:
        """Update token quotas including API key if provided"""
        # Update tenant and user quotas
        usage = await self.get(f"quota:{tenant_id}:{user_id}")
        new_tenant_usage = usage.get("tenant_usage", 0) + tokens
        new_user_usage = usage.get("user_usage", 0) + tokens
        
        await self.set(f"quota:{tenant_id}:{user_id}", {
            "tenant_usage": new_tenant_usage,
            "user_usage": new_user_usage
        })
        
        # Update API key quota if provided
        if api_key_id:
            api_key_usage = await self.get(f"quota:{tenant_id}:{user_id}:{api_key_id}")
            new_api_key_usage = api_key_usage.get("usage", 0) + tokens
            await self.set(f"quota:{tenant_id}:{user_id}:{api_key_id}", {
                "usage": new_api_key_usage
            })
            return {
                "tenant_usage": new_tenant_usage,
                "user_usage": new_user_usage,
                "api_key_usage": new_api_key_usage
            }
        
        return {
            "tenant_usage": new_tenant_usage,
            "user_usage": new_user_usage
        }
```

### 3. Update Existing API Keys

Create a migration script to update existing API keys with user associations:

```python
# scripts/update_api_keys.py
import asyncio
from sqlalchemy import select
from src.models.system import APIKey
from src.core.database import get_tenant_db_session

async def update_existing_api_keys():
    """Associate existing API keys with users and initialize quota tracking"""
    async with get_tenant_db_session("system") as session:
        # Get all API keys
        result = await session.execute(select(APIKey))
        keys = result.scalars().all()
        
        for key in keys:
            # You may want to map keys to users based on your business logic
            key.user_id = "default_admin"  # or appropriate user ID
            key.quota_limit = None  # or a default value
            key.current_quota_usage = 0
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(update_existing_api_keys())
```

Run the migration script:

```bash
python scripts/update_api_keys.py
```

### 4. API Updates

Update your API key creation endpoint to require user association:

```python
@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_tenant_db_session)
):
    """Create a new API key associated with the current user"""
    api_key = APIKey(
        id=str(uuid.uuid4()),
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        name=key_data.name,
        key_hash=AuthService.hash_api_key(key_data.key),
        quota_limit=key_data.quota_limit,
        permissions=key_data.permissions
    )
    
    session.add(api_key)
    await session.commit()
    return api_key
```

### 5. Testing

Test the updated implementation:

1. Create a new API key:
```bash
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "Test Key",
    "quota_limit": 1000
  }'
```

2. Test LLM endpoint without user_id:
```bash
curl -X POST http://localhost:8000/api/v1/chat/completions \
  -H "X-API-Key: your_api_key" \
  -H "X-Tenant-ID: your_tenant_id" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.7
  }'
```

### 6. Monitoring

Monitor the changes:

1. Check application logs:
```bash
tail -f logs/app.log
```

2. Verify Redis quota tracking:
```bash
redis-cli
> GET "quota:tenant_id:user_id:api_key_id"
```

### 7. Documentation Updates

1. Update API documentation to:
   - Remove user field from endpoints using API key authentication
   - Add quota fields to API key related schemas
   - Update example requests
   - Document new quota tracking behavior

2. Update integration guides to reflect the API key changes

## Troubleshooting

### Common Issues

1. Missing User Associations
   - Run the update_api_keys.py script to fix
   - Check logs for any API keys without user_id

2. Quota Tracking Issues
   - Verify Redis keys are being created correctly
   - Check QuotaService logs for tracking issues

3. Migration Failures
   - Use `alembic downgrade -1` to rollback
   - Check alembic logs for specific errors

### Support

For any issues during migration:
1. Check application logs
2. Verify database consistency
3. Contact the development team with specific error messages

## Post-Migration Tasks

1. Monitor system metrics for:
   - API key usage patterns
   - Quota consumption rates
   - Error rates

2. Regular validation:
   - API key associations
   - Quota accuracy
   - Usage tracking reliability