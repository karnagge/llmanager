from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict

import asyncpg
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.core.config import get_settings
from src.core.exceptions import DatabaseError
from src.core.utils import get_tenant_database_name

settings = get_settings()


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""

    pass


# Store tenant-specific engines and session factories
tenant_engines: Dict[str, AsyncSession] = {}
tenant_session_factories: Dict[str, async_sessionmaker[AsyncSession]] = {}


def get_tenant_db_url(tenant_id: str) -> str:
    """Get database URL for a specific tenant"""
    db_name = get_tenant_database_name(tenant_id)
    base_url = str(settings.DATABASE_URI)
    # Replace database name in the connection URL
    return base_url.rsplit("/", 1)[0] + "/" + db_name


async def create_tenant_database(tenant_id: str) -> None:
    """Create a new database for a tenant"""
    try:
        # Get database connection info from settings
        base_url = str(settings.DATABASE_URI)
        dsn = base_url.replace("postgresql+asyncpg://", "postgresql://")
        db_name = get_tenant_database_name(tenant_id)

        # Connect to postgres database
        conn = await asyncpg.connect(
            dsn,
            database="postgres",
        )

        try:
            # Create new database
            await conn.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
            await conn.execute(f'CREATE DATABASE "{db_name}"')
        finally:
            await conn.close()

        # Initialize schema in new tenant database
        tenant_engine = create_async_engine(
            get_tenant_db_url(tenant_id), poolclass=NullPool, echo=settings.DEBUG
        )

        async with tenant_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        await tenant_engine.dispose()

    except Exception as e:
        raise DatabaseError(
            message="Failed to create tenant database",
            operation="create_database",
            details=str(e),
        )


async def drop_tenant_database(tenant_id: str) -> None:
    """Drop a tenant's database"""
    try:
        # Connect to default database to drop tenant database
        default_engine = create_async_engine(
            str(settings.DATABASE_URI), poolclass=NullPool, echo=settings.DEBUG
        )

        db_name = get_tenant_database_name(tenant_id)

        async with default_engine.connect() as conn:
            # Terminate any existing connections to the database
            await conn.execute(
                f"""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '{db_name}'
                AND pid <> pg_backend_pid()
                """
            )
            # Drop the database
            await conn.execute(f'DROP DATABASE IF EXISTS "{db_name}"')

        await default_engine.dispose()

    except Exception as e:
        raise DatabaseError(
            message="Failed to drop tenant database",
            operation="drop_database",
            details=str(e),
        )


def get_tenant_session_factory(tenant_id: str) -> async_sessionmaker[AsyncSession]:
    """Get or create session factory for a tenant"""
    if tenant_id not in tenant_session_factories:
        engine = create_async_engine(
            get_tenant_db_url(tenant_id), pool_pre_ping=True, echo=settings.DEBUG
        )
        tenant_engines[tenant_id] = engine
        tenant_session_factories[tenant_id] = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
    return tenant_session_factories[tenant_id]


@asynccontextmanager
async def get_tenant_db_session(tenant_id: str) -> AsyncGenerator[AsyncSession, None]:
    """Get a database session for a tenant"""
    session_factory = get_tenant_session_factory(tenant_id)
    session = session_factory()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise DatabaseError(
            message="Database session error",
            operation="session_management",
            details=str(e),
        )
    finally:
        await session.close()


async def cleanup_tenant_connections(tenant_id: str) -> None:
    """Cleanup database connections for a tenant"""
    if tenant_id in tenant_engines:
        engine = tenant_engines[tenant_id]
        await engine.dispose()
        del tenant_engines[tenant_id]
        del tenant_session_factories[tenant_id]


async def initialize_database() -> None:
    """Initialize the main database with system tables"""
    try:
        engine = create_async_engine(str(settings.DATABASE_URI), echo=settings.DEBUG)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        await engine.dispose()

    except Exception as e:
        raise DatabaseError(
            message="Failed to initialize database",
            operation="initialize_database",
            details=str(e),
        )
