import asyncio
import logging
import uuid

from sqlalchemy import text

from src.core.auth import AuthService
from src.core.config import get_settings
from src.core.database import get_tenant_db_session
from src.core.logging import get_logger
from src.models.system import APIKey
from src.models.tenant import User, UserRole

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = get_logger(__name__)

settings = get_settings()

async def create_user():
    try:
        # First create admin user in tenant database
        logger.info("Connecting to admin tenant database...")
        async with get_tenant_db_session("admin") as tenant_session:
            # Create admin user
            user_id = str(uuid.uuid4())
            user = User(
                id=user_id,
                email="admin@example.com",
                name="Admin User",
                password_hash=AuthService.hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
                quota_limit=500000,
                current_quota_usage=0,
                settings={},
            )
            tenant_session.add(user)
            await tenant_session.commit()
            logger.info("Admin user created successfully")

        # Then create API key in system database
        logger.info("Connecting to system database to create API key...")
        async with get_tenant_db_session("system") as system_session:
            api_key_str = AuthService.create_api_key()
            key_hash = AuthService.hash_api_key(api_key_str)
            api_key = APIKey(
                id=str(uuid.uuid4()),
                tenant_id="admin",
                user_id=user_id,  # Link API key to user
                name="Admin User API Key",
                key_hash=key_hash,
                permissions={"scopes": ["admin:*"]},
                is_active=True,
                quota_limit=500000,
            )
            system_session.add(api_key)
            await system_session.commit()
            logger.info("API key created and linked to user")

            print("\nAdmin user created:")
            print("Email: admin@example.com")
            print("Password: admin123")
            print(f"API Key: {api_key_str}")

            # Verify setup
            logger.info("Verifying setup...")

            # Check tenant exists
            result = await system_session.execute(
                text("SELECT id, name, quota_limit FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": "admin"},
            )
            tenant = result.fetchone()
            if tenant:
                logger.info(
                    "Verified tenant",
                    id=tenant[0],
                    name=tenant[1],
                    quota_limit=tenant[2],
                )
            else:
                logger.error("Admin tenant not found in verification!")
                raise ValueError("Admin tenant not found")

        # Verify user in tenant database
        async with get_tenant_db_session("admin") as tenant_session:
            result = await tenant_session.execute(
                text("SELECT id, email, role FROM users WHERE email = :email"),
                {"email": "admin@example.com"},
            )
            user = result.fetchone()
            if user:
                logger.info("Verified user", id=user[0], email=user[1], role=user[2])
            else:
                logger.error("Admin user not found in verification!")
                raise ValueError("Admin user not found")

            # Verify API key in system database
            async with get_tenant_db_session("system") as system_session:
                result = await system_session.execute(
                    text("SELECT id, user_id, tenant_id FROM api_keys WHERE user_id = :user_id"),
                    {"user_id": user_id},
                )
                api_key = result.fetchone()
                if api_key:
                    logger.info("Verified API key", id=api_key[0], user_id=api_key[1], tenant_id=api_key[2])
                else:
                    logger.error("API key not found in verification!")
                    raise ValueError("API key not found")

    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(create_user())
