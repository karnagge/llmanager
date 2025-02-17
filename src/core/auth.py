import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Union

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.database import get_tenant_db_session
from src.core.exceptions import InvalidAPIKeyError
from src.core.utils import generate_hash
from src.models.system import APIKey, Tenant
from src.models.tenant import User, UserRole

settings = get_settings()

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)
tenant_id_header = APIKeyHeader(name="X-Tenant-ID", auto_error=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for handling authentication and authorization"""

    @staticmethod
    def create_api_key() -> str:
        """Generate a new API key"""
        return f"llm_{uuid.uuid4().hex}"

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash an API key"""
        return generate_hash(api_key)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(
        data: Dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )

        to_encode.update({"exp": expire})

        return jwt.encode(
            to_encode,
            settings.SECRET_KEY.get_secret_value(),
            algorithm=settings.ALGORITHM,
        )

    @staticmethod
    def decode_token(token: str) -> Dict:
        """Decode and validate a JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY.get_secret_value(),
                algorithms=[settings.ALGORITHM],
            )
            return payload
        except JWTError as e:
            raise InvalidAPIKeyError(f"Invalid token: {str(e)}")

    @staticmethod
    async def validate_api_key(
        api_key: str, session: AsyncSession
    ) -> Union[APIKey, None]:
        """Validate an API key and return the associated API key record"""
        key_hash = AuthService.hash_api_key(api_key)

        # Query the API key
        result = await session.execute(
            text("""
            SELECT ak.id, ak.tenant_id, ak.name, ak.key_hash, 
                   ak.is_active, ak.permissions, ak.expires_at, 
                   ak.last_used_at, ak.created_at, ak.updated_at,
                   t.is_active as tenant_is_active
            FROM api_keys ak
            JOIN tenants t ON t.id = ak.tenant_id
            WHERE ak.key_hash = :key_hash
            """),
            {"key_hash": key_hash},
        )
        record = result.first()

        if not record:
            return None

        # Create API key object from record
        api_key_obj = APIKey(
            id=record.id,
            tenant_id=record.tenant_id,
            name=record.name,
            key_hash=record.key_hash,
            is_active=record.is_active,
            permissions=record.permissions,
            expires_at=record.expires_at,
            last_used_at=record.last_used_at,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

        # Validate key and tenant status
        if not api_key_obj.is_active:
            raise InvalidAPIKeyError("API key is inactive")

        if not record.tenant_is_active:
            raise InvalidAPIKeyError("Tenant is inactive")

        if api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
            raise InvalidAPIKeyError("API key has expired")

        # Update last used timestamp
        api_key_obj.last_used_at = datetime.utcnow()
        await session.merge(api_key_obj)
        await session.commit()

        return api_key_obj

    @staticmethod
    async def get_current_tenant(api_key: str = Security(api_key_header)) -> Tenant:
        """Get the current tenant from the API key"""
        if not api_key:
            raise InvalidAPIKeyError("API key is required")

        async with get_tenant_db_session("system") as session:
            api_key_obj = await AuthService.validate_api_key(api_key, session)
            if not api_key_obj:
                raise InvalidAPIKeyError("Invalid API key")

            # Get tenant
            tenant = await session.get(Tenant, api_key_obj.tenant_id)
            if not tenant:
                raise InvalidAPIKeyError("Tenant not found")

            return tenant

    @staticmethod
    async def verify_permissions(
        api_key_obj: APIKey, required_permissions: set
    ) -> bool:
        """Verify that an API key has the required permissions"""
        if not api_key_obj.permissions:
            return False

        api_key_permissions = set(api_key_obj.permissions.get("scopes", []))
        return required_permissions.issubset(api_key_permissions)

    @staticmethod
    async def get_current_user(tenant_id: str, token: str) -> User:
        """Get the current user from a JWT token"""
        try:
            payload = AuthService.decode_token(token)
            user_id = payload.get("sub")
            if not user_id:
                raise InvalidAPIKeyError("Invalid token contents")

            async with get_tenant_db_session(tenant_id) as session:
                user = await session.get(User, user_id)
                if not user:
                    raise InvalidAPIKeyError("User not found")
                if not user.is_active:
                    raise InvalidAPIKeyError("User is inactive")

                return user

        except JWTError:
            raise InvalidAPIKeyError("Could not validate token")

    @staticmethod
    def check_role_permissions(user: User, required_roles: set[UserRole]) -> bool:
        """Check if a user has any of the required roles"""
        return user.role in required_roles


async def get_current_tenant_and_key(
    api_key: str = Security(api_key_header),
    tenant_provided_id: str = Security(tenant_id_header),
) -> tuple[Tenant, APIKey]:
    """Dependency to get current tenant and API key"""
    if not api_key:
        raise InvalidAPIKeyError("API key is required")
    if not tenant_provided_id:
        raise InvalidAPIKeyError("Tenant ID is required")

    async with get_tenant_db_session("system") as session:
        api_key_obj = await AuthService.validate_api_key(api_key, session)
        if not api_key_obj:
            raise InvalidAPIKeyError("Invalid API key")

        tenant = await session.get(Tenant, api_key_obj.tenant_id)
        if not tenant:
            raise InvalidAPIKeyError("Tenant not found")

        # Verify that the provided tenant ID matches the one from the API key
        if tenant.id != tenant_provided_id:
            raise InvalidAPIKeyError("Invalid tenant ID")

        return tenant, api_key_obj


def check_permissions(required_permissions: set):
    """Create a dependency that checks API key permissions"""

    async def check_permissions_dependency(
        tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    ) -> None:
        _, api_key = tenant_key
        if not await AuthService.verify_permissions(api_key, required_permissions):
            raise HTTPException(status_code=403, detail="Insufficient permissions")

    return check_permissions_dependency


# Convenience dependencies
get_current_tenant = AuthService.get_current_tenant
