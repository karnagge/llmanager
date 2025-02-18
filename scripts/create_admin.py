import asyncio
import logging
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import AuthService
from src.core.config import get_settings
from src.core.database import (
    create_tenant_database,
    get_tenant_db_session,
    initialize_database,
)
from src.core.logging import get_logger
from src.models.system import APIKey, Tenant
from src.models.system import Base as SystemBase
from src.models.tenant import Base as TenantBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = get_logger(__name__)

settings = get_settings()


async def copy_tenants(source_session: AsyncSession, target_session: AsyncSession):
    """Copy tenants from source to target database"""
    try:
        # Get all tenants from source
        result = await source_session.execute(
            text("""
                SELECT id, name, db_name, is_active, quota_limit, 
                      current_quota_usage, config::text, 
                      created_at, updated_at
                FROM tenants
            """)
        )
        tenants = result.fetchall()

        # Insert tenants into target
        for tenant in tenants:
            await target_session.execute(
                text("""
                    INSERT INTO tenants (
                        id, name, db_name, is_active, quota_limit,
                        current_quota_usage, config,
                        created_at, updated_at
                    ) VALUES (
                        :id, :name, :db_name, :is_active, :quota_limit,
                        :current_quota_usage, :config::json,
                        :created_at, :updated_at
                    )
                """),
                {
                    "id": tenant[0],
                    "name": tenant[1],
                    "db_name": tenant[2],
                    "is_active": tenant[3],
                    "quota_limit": tenant[4],
                    "current_quota_usage": tenant[5],
                    "config": tenant[6],
                    "created_at": tenant[7],
                    "updated_at": tenant[8],
                },
            )
        await target_session.commit()
        logger.info(f"Copied {len(tenants)} tenants to target database")
    except Exception as e:
        logger.error("Failed to copy tenants", error=str(e))
        raise


async def create_admin():
    tenant_id = "admin"
    api_key = "llm_admin_test_key"

    try:
        # Initialize system database first
        logger.info("Initializing system database...")
        await initialize_database()
        logger.info("System database initialized successfully")

        # Create the physical database first
        logger.info("Creating admin database...")
        await create_tenant_database(tenant_id)
        logger.info("Admin database created successfully")

        # Create admin tenant in system database
        async with get_tenant_db_session("system") as session:
            # Check if admin tenant already exists
            logger.info("Checking for existing admin tenant...")
            result = await session.execute(
                text("SELECT id FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": tenant_id},
            )
            existing_tenant = result.scalar()

            if existing_tenant:
                logger.info("Admin tenant already exists, skipping creation")
                return

            # Create admin tenant record
            logger.info("Creating admin tenant with quota_limit=1000000...")
            tenant = Tenant(
                id=tenant_id,
                name="Admin Tenant",
                db_name="tenant_admin",
                quota_limit=1000000,
                current_quota_usage=0,
                config={"rate_limit": {"requests": 1000, "period": 3600}},
                is_active=True,
            )
            session.add(tenant)

            # Create API key
            logger.info("Creating API key...")
            key_hash = AuthService.hash_api_key(api_key)
            api_key_obj = APIKey(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                name="Admin API Key",
                key_hash=key_hash,
                permissions={"scopes": ["admin:*"]},
                is_active=True,
            )
            session.add(api_key_obj)
            await session.commit()
            logger.info("Created admin tenant and API key in system database")

            # Copy to admin database
            async with get_tenant_db_session("admin") as admin_session:
                # Copy tenant record
                await copy_tenants(session, admin_session)
                logger.info("Copied tenant record to admin database")

                # Create tables in admin database
                tenant_engine = admin_session.bind
                async with tenant_engine.begin() as conn:
                    await conn.run_sync(SystemBase.metadata.create_all)
                    logger.info("System tables created in admin database")
                    await conn.run_sync(TenantBase.metadata.create_all)
                    logger.info("Tenant tables created in admin database")

            logger.info("Successfully created admin tenant and API key")
            print(f"Admin tenant created with ID: {tenant_id}")
            print(f"API Key created: {api_key}")
            print("Use these values in your requests:")
            print(f"X-Tenant-ID: {tenant_id}")
            print(f"X-API-Key: {api_key}")

    except Exception as e:
        logger.error(f"Error creating admin: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(create_admin())
