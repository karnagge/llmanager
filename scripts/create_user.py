import asyncio
import logging
import uuid

from sqlalchemy import text

from src.core.auth import AuthService
from src.core.config import get_settings
from src.core.database import get_tenant_db_session
from src.core.logging import get_logger
from src.models.tenant import User, UserRole

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = get_logger(__name__)

settings = get_settings()


async def create_user():
    try:
        # Connect directly to tenant_admin database
        logger.info("Connecting to admin tenant database...")
        async with get_tenant_db_session("admin") as session:
            # Create admin user
            user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com",
                name="Admin User",
                password_hash=AuthService.hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
                quota_limit=500000,
                current_quota_usage=0,
                settings={},
            )
            session.add(user)
            await session.commit()
            logger.info("Admin user created successfully")
            print("Admin user created:")
            print("Email: admin@example.com")
            print("Password: admin123")

            # Verify setup
            logger.info("Verifying setup...")

            # Check tenant exists
            result = await session.execute(
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

            # Check user
            result = await session.execute(
                text("SELECT id, email, role FROM users WHERE email = :email"),
                {"email": "admin@example.com"},
            )
            user = result.fetchone()
            if user:
                logger.info("Verified user", id=user[0], email=user[1], role=user[2])
            else:
                logger.error("Admin user not found in verification!")
                raise ValueError("Admin user not found")

    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(create_user())
