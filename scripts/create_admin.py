import asyncio
import logging
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from src.core.auth import AuthService
from src.core.config import get_settings
from src.core.database import (
    create_async_engine,
    create_tenant_database,
    initialize_database,
)
from src.models.system import APIKey, Tenant
from src.models.system import Base as SystemBase
from src.models.tenant import Base as TenantBase


async def copy_tenants(source_session: AsyncSession, target_session: AsyncSession):
    """Copy tenants from source to target database"""
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
                    :current_quota_usage, CAST(:config AS json),
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


# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

settings = get_settings()


async def create_admin():
    tenant_id = "admin"
    api_key = "llm_admin_test_key"

    # Create engine and session
    engine = create_async_engine(str(settings.DATABASE_URI), echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        # Initialize system database first
        logger.info("Initializing system database...")
        await initialize_database()
        logger.info("System database initialized successfully")

        # Create the physical database first
        logger.info("Creating admin database...")
        await create_tenant_database("admin")
        logger.info("Admin database created successfully")

        async with async_session() as session:
            # Check if admin tenant already exists
            logger.info("Checking for existing admin tenant...")
            result = await session.execute(
                text("SELECT id FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": "admin"},
            )
            existing_tenant = result.scalar()

            if existing_tenant:
                logger.info("Admin tenant already exists, skipping creation")
                return

            # Create admin tenant record
            logger.info("Creating admin tenant record...")
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
            await session.flush()

            # Verify tenant was created correctly
            result = await session.execute(
                text("SELECT id, name, quota_limit FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": "admin"},
            )
            saved_tenant = result.fetchone()
            logger.info(
                f"Saved tenant - ID: {saved_tenant[0]}, Name: {saved_tenant[1]}, Quota: {saved_tenant[2]}"
            )

            if not saved_tenant[2]:  # quota_limit is the third column
                logger.error("Tenant created but quota_limit is null!")
                raise ValueError("Failed to save quota_limit")

            logger.info(f"Admin tenant created successfully with ID: {tenant_id}")

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

            # Create tables in tenant database
            logger.info("Creating tables in tenant admin database...")
            tenant_uri = str(settings.DATABASE_URI).replace(
                "/tenant_system", "/tenant_admin"
            )
            tenant_engine = create_async_engine(tenant_uri, echo=True)

            try:
                async with tenant_engine.begin() as conn:
                    # Create system tables first
                    await conn.run_sync(SystemBase.metadata.create_all)
                    logger.info("System tables created in tenant database")
                    # Create tenant-specific tables
                    await conn.run_sync(TenantBase.metadata.create_all)
                    logger.info("Tenant tables created in tenant database")

                # Create session for tenant database and copy tenants
                tenant_session = sessionmaker(
                    tenant_engine, class_=AsyncSession, expire_on_commit=False
                )
                async with tenant_session() as tsession:
                    # Copy tenants from system database to tenant database
                    await copy_tenants(session, tsession)
                    logger.info("Tenants copied to tenant database")
            finally:
                await tenant_engine.dispose()

            logger.info("Successfully created admin tenant and API key")
            print(f"Admin tenant created with ID: {tenant_id}")
            print(f"API Key created: {api_key}")
            print("Use these values in your requests:")
            print(f"X-Tenant-ID: {tenant_id}")
            print(f"X-API-Key: {api_key}")

    except Exception as e:
        logger.error(f"Error creating admin: {str(e)}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin())
