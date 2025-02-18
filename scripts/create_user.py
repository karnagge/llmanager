import asyncio
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from src.core.auth import AuthService
from src.core.config import get_settings
from src.core.database import create_async_engine
from src.models.tenant import User, UserRole

settings = get_settings()


async def create_user():
    # Connect directly to tenant_admin database
    tenant_uri = str(settings.DATABASE_URI).replace("/tenant_system", "/tenant_admin")
    tenant_engine = create_async_engine(tenant_uri, echo=True)
    tenant_session = sessionmaker(
        tenant_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with tenant_session() as tsession:
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
            tsession.add(user)
            await tsession.commit()
            print("Admin user created successfully")
            print("Email: admin@example.com")
            print("Password: admin123")

            # Verify tables and data
            print("\nVerifying setup:")

            # Check tenant (should already exist from create_admin.py)
            result = await tsession.execute(
                text("SELECT id, name, quota_limit FROM tenants WHERE id = :tenant_id"),
                {"tenant_id": "admin"},
            )
            tenant = result.fetchone()
            if tenant:
                print(
                    f"Verified tenant - ID: {tenant[0]}, Name: {tenant[1]}, Quota: {tenant[2]}"
                )
            else:
                print("Warning: Tenant not found in verification")

            # Check user
            result = await tsession.execute(
                text("SELECT id, email, role FROM users WHERE email = :email"),
                {"email": "admin@example.com"},
            )
            user = result.fetchone()
            if user:
                print(
                    f"Verified user - ID: {user[0]}, Email: {user[1]}, Role: {user[2]}"
                )
            else:
                print("Warning: User not found in verification")

    except Exception as e:
        print(f"Error creating user: {str(e)}")
        raise
    finally:
        await tenant_engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_user())
