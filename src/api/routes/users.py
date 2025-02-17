from datetime import datetime, timedelta
from typing import Dict, List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select

from src.core.auth import AuthService, check_permissions, get_current_tenant_and_key
from src.core.config import get_settings
from src.core.database import get_tenant_db_session
from src.models.system import APIKey, Tenant
from src.models.tenant import UsageLog, User
from src.schemas import (
    Token,
    UserCreate,
    UserResponse,
    UserUpdate,
)

settings = get_settings()
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Routes
@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
) -> Token:
    """User login endpoint"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        # Get user
        result = await session.execute(
            select(User).where(User.email == form_data.username)
        )
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not AuthService.verify_password(form_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Update last login
        user.last_login = datetime.utcnow()
        await session.commit()

        # Generate tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthService.create_access_token(
            data={"sub": user.id, "tenant_id": tenant.id, "role": user.role},
            expires_delta=access_token_expires,
        )

        refresh_token = None
        if settings.REFRESH_TOKEN_EXPIRE_DAYS:
            refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            refresh_token = AuthService.create_access_token(
                data={"sub": user.id, "tenant_id": tenant.id, "is_refresh": True},
                expires_delta=refresh_token_expires,
            )

        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=refresh_token,
        )


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:create_user"})),
) -> UserResponse:
    """Create a new user"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        # Check if email already exists
        result = await session.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        user = User(
            id=str(uuid4()),
            email=user_data.email,
            password_hash=AuthService.hash_password(user_data.password),
            name=user_data.name,
            role=user_data.role,
            quota_limit=user_data.quota_limit,
            settings=user_data.settings,
        )
        session.add(user)
        await session.commit()

        return UserResponse.model_validate(user)


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_user"})),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[UserResponse]:
    """List all users"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        result = await session.execute(select(User).offset(offset).limit(limit))
        users = result.scalars().all()
        return [UserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_user"})),
) -> UserResponse:
    """Get a specific user"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:update_user"})),
) -> UserResponse:
    """Update a user"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update fields
        if update_data.name is not None:
            user.name = update_data.name
        if update_data.password is not None:
            user.password_hash = AuthService.hash_password(update_data.password)
        if update_data.role is not None:
            user.role = update_data.role
        if update_data.is_active is not None:
            user.is_active = update_data.is_active
        if update_data.quota_limit is not None:
            user.quota_limit = update_data.quota_limit
        if update_data.settings is not None:
            user.settings = update_data.settings

        await session.commit()
        return UserResponse.model_validate(user)


@router.get("/users/{user_id}/usage")
async def get_user_usage(
    user_id: str,
    start_date: datetime,
    end_date: datetime,
    tenant_key: tuple[Tenant, APIKey] = Depends(get_current_tenant_and_key),
    permissions: None = Depends(check_permissions({"admin:read_usage"})),
) -> Dict:
    """Get token usage statistics for a user"""
    tenant, _ = tenant_key

    async with get_tenant_db_session(tenant.id) as session:
        # Get usage logs for the period
        result = await session.execute(
            select(UsageLog).where(
                UsageLog.user_id == user_id,
                UsageLog.timestamp >= start_date,
                UsageLog.timestamp <= end_date,
            )
        )
        logs = result.scalars().all()

        # Calculate statistics
        total_tokens = sum(log.total_tokens for log in logs)
        total_cost = sum(log.cost for log in logs)

        usage_by_model = {}
        for log in logs:
            if log.model not in usage_by_model:
                usage_by_model[log.model] = {"total_tokens": 0, "cost": 0}
            usage_by_model[log.model]["total_tokens"] += log.total_tokens
            usage_by_model[log.model]["cost"] += log.cost

        return {
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total_tokens": total_tokens,
            "total_cost": total_cost,
            "usage_by_model": usage_by_model,
        }
