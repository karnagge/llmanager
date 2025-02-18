import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from src.core.config import get_settings
from src.core.database import create_async_engine

settings = get_settings()


async def verify_setup():
    # Check system database
    system_engine = create_async_engine(str(settings.DATABASE_URI), echo=True)
    system_session = sessionmaker(
        system_engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        print("\nChecking tenant_system database:")
        async with system_session() as session:
            result = await session.execute(
                text("SELECT id, name, quota_limit FROM tenants WHERE id = 'admin'")
            )
            tenant = result.fetchone()
            if tenant:
                print(
                    f"Found tenant in system database - ID: {tenant[0]}, Name: {tenant[1]}, Quota: {tenant[2]}"
                )
            else:
                print("No tenant found in system database")

        # Check tenant database
        tenant_uri = str(settings.DATABASE_URI).replace(
            "/tenant_system", "/tenant_admin"
        )
        tenant_engine = create_async_engine(tenant_uri, echo=True)
        tenant_session = sessionmaker(
            tenant_engine, class_=AsyncSession, expire_on_commit=False
        )

        print("\nChecking tenant_admin database:")
        async with tenant_session() as session:
            # Check tenant
            result = await session.execute(
                text("SELECT id, name, quota_limit FROM tenants WHERE id = 'admin'")
            )
            tenant = result.fetchone()
            if tenant:
                print(
                    f"Found tenant in tenant database - ID: {tenant[0]}, Name: {tenant[1]}, Quota: {tenant[2]}"
                )
            else:
                print("No tenant found in tenant database")

            # Check user
            result = await session.execute(
                text(
                    "SELECT id, email, role FROM users WHERE email = 'admin@example.com'"
                )
            )
            user = result.fetchone()
            if user:
                print(f"Found user - ID: {user[0]}, Email: {user[1]}, Role: {user[2]}")
            else:
                print("No user found")

    except Exception as e:
        print(f"Error verifying setup: {str(e)}")
        raise
    finally:
        await system_engine.dispose()
        if "tenant_engine" in locals():
            await tenant_engine.dispose()


if __name__ == "__main__":
    asyncio.run(verify_setup())
