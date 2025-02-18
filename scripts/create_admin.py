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
                text("SELECT id FROM tenants WHERE id = 'admin'")
            )
            existing_tenant = result.scalar()

            if existing_tenant:
                logger.info("Admin tenant already exists, skipping creation")
                return

            # Create admin tenant record
            logger.info("Creating admin tenant record...")
            tenant = Tenant(
                id=tenant_id,
                name="Admin Tenant",
                db_name="tenant_admin",
                quota_limit=1000000,
                config={"rate_limit": {"requests": 1000, "period": 3600}},
            )
            session.add(tenant)
            await session.flush()
            logger.info(f"Admin tenant created with ID: {tenant_id}")

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
