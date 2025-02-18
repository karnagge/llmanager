#!/usr/bin/env python
import asyncio
import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_tenant_db_session
from src.models.system import APIKey
from src.models.tenant import User


async def associate_api_keys_with_users():
    """Associate existing API keys with admin users in each tenant"""
    print("🔑 Starting API key migration...")

    try:
        # Get all API keys from system database
        async with get_tenant_db_session("system") as system_session:
            # Get all API keys
            result = await system_session.execute(select(APIKey))
            api_keys = result.scalars().all()

            for key in api_keys:
                # For each tenant, get the admin user
                async with get_tenant_db_session(key.tenant_id) as tenant_session:
                    # Get admin user
                    result = await tenant_session.execute(
                        select(User).where(User.role == 'admin').limit(1)
                    )
                    admin_user = result.scalar_one_or_none()

                    if admin_user:
                        print(f"Found admin user {admin_user.email} for tenant {key.tenant_id}")
                        
                        # Update API key with user association
                        key.user_id = admin_user.id
                        key.quota_limit = None  # No specific quota limit
                        key.current_quota_usage = 0
                        
                        await system_session.commit()
                        print(f"✅ Updated API key {key.id}")
                    else:
                        print(f"⚠️  No admin user found for tenant {key.tenant_id}")

            print("\n✨ Migration complete!")
            print(f"Processed {len(api_keys)} API keys")

    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(associate_api_keys_with_users())