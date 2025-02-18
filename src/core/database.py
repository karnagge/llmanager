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
from src.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""

    pass


# Store tenant-specific engines and session factories
tenant_engines: Dict[str, AsyncSession] = {}
tenant_session_factories: Dict[str, async_sessionmaker[AsyncSession]] = {}


def get_system_db_url() -> str:
    """Get the system database URL"""
    return str(settings.DATABASE_URI)


def get_tenant_db_url(tenant_id: str) -> str:
    """Get database URL for a specific tenant"""
    # Special cases for system and admin databases
    if tenant_id == "system":
        db_name = "tenant_system"
    elif tenant_id == "admin":
        db_name = "tenant_admin"
    else:
        db_name = f"tenant_{tenant_id}"

    base_url = str(settings.DATABASE_URI)
    new_url = base_url.rsplit("/", 1)[0] + "/" + db_name

    logger.debug(
        "constructing_db_url", tenant_id=tenant_id, db_name=db_name, final_url=new_url
    )
    return new_url


async def create_tenant_database(tenant_id: str) -> None:
    """Create a new database for a tenant"""
    try:
        # Get database connection info from settings
        base_url = str(settings.DATABASE_URI)
        dsn = base_url.replace("postgresql+asyncpg://", "postgresql://")
        db_name = f"tenant_{tenant_id}"

        logger.info("creating_tenant_database", tenant_id=tenant_id, db_name=db_name)

        # Connect to postgres database
        conn = await asyncpg.connect(
            dsn,
            database="postgres",
        )

        try:
            # Create new database
            await conn.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
            await conn.execute(f'CREATE DATABASE "{db_name}"')
            logger.info("tenant_database_created", tenant_id=tenant_id, db_name=db_name)
        finally:
            await conn.close()

        # Initialize schema in new tenant database
        logger.debug("initializing_tenant_schema", tenant_id=tenant_id)
        tenant_engine = create_async_engine(
            get_tenant_db_url(tenant_id), poolclass=NullPool, echo=settings.DEBUG
        )

        async with tenant_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        await tenant_engine.dispose()
        logger.info("tenant_schema_initialized", tenant_id=tenant_id)

    except Exception as e:
        logger.error(
            "tenant_database_creation_failed", tenant_id=tenant_id, error=str(e)
        )
        raise DatabaseError(
            message="Failed to create tenant database",
            operation="create_database",
            details=str(e),
        )


def get_tenant_session_factory(tenant_id: str) -> async_sessionmaker[AsyncSession]:
    """Get or create session factory for a tenant"""
    if tenant_id not in tenant_session_factories:
        db_url = get_tenant_db_url(tenant_id)
        logger.debug(
            "creating_session_factory",
            tenant_id=tenant_id,
            db_url=db_url,
            existing_factories=list(tenant_session_factories.keys()),
        )

        engine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            echo=settings.DEBUG,
            isolation_level="READ COMMITTED",
        )
        tenant_engines[tenant_id] = engine
        tenant_session_factories[tenant_id] = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
        )
        logger.info("session_factory_created", tenant_id=tenant_id, db_url=db_url)
    else:
        logger.debug(
            "reusing_session_factory",
            tenant_id=tenant_id,
            db_url=str(tenant_engines[tenant_id].url),
        )

    return tenant_session_factories[tenant_id]


@asynccontextmanager
async def get_tenant_db_session(tenant_id: str) -> AsyncGenerator[AsyncSession, None]:
    """Get a database session for a tenant"""
    session = None
    try:
        session_factory = get_tenant_session_factory(tenant_id)
        session = session_factory()

        logger.debug(
            "db_session_created",
            tenant_id=tenant_id,
            session_info={
                "bind": str(session.bind.url) if session.bind else None,
                "in_transaction": session.in_transaction(),
                "is_active": session.is_active,
            },
        )

        try:
            yield session
            if session.in_transaction():
                await session.commit()
                logger.debug("session_committed", tenant_id=tenant_id)
        except Exception as e:
            if session.in_transaction():
                await session.rollback()
                logger.debug("session_rolled_back", tenant_id=tenant_id, error=str(e))
            raise DatabaseError(
                message="Database session error",
                operation="session_management",
                details=str(e),
            )
    except Exception as e:
        logger.error(
            "session_error",
            tenant_id=tenant_id,
            error=str(e),
            error_type=e.__class__.__name__,
        )
        raise
    finally:
        if session:
            await session.close()
            logger.debug("session_closed", tenant_id=tenant_id)


async def cleanup_tenant_connections(tenant_id: str) -> None:
    """Cleanup database connections for a tenant"""
    if tenant_id in tenant_engines:
        engine = tenant_engines[tenant_id]
        await engine.dispose()
        del tenant_engines[tenant_id]
        del tenant_session_factories[tenant_id]
        logger.info("tenant_connections_cleaned", tenant_id=tenant_id)


async def initialize_database() -> None:
    """Initialize the main database with system tables"""
    try:
        logger.info("initializing_system_database")
        engine = create_async_engine(
            get_system_db_url(), echo=settings.DEBUG, isolation_level="READ COMMITTED"
        )

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        await engine.dispose()
        logger.info("system_database_initialized")

    except Exception as e:
        logger.error("database_initialization_failed", error=str(e))
        raise DatabaseError(
            message="Failed to initialize database",
            operation="initialize_database",
            details=str(e),
        )
