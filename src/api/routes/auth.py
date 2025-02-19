from datetime import timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import AuthService, get_current_user
from src.core.config import get_settings
from src.core.database import get_tenant_db_session
from src.models.system import APIKey
from src.models.tenant import User, UserRole
from src.schemas import AuthResponse, LoginData, RegisterData, Token, UserData

router = APIRouter()
settings = get_settings()

@router.post("/login", response_model=AuthResponse)
async def login(data: LoginData) -> AuthResponse:
    """Login user and return tokens"""
    async with get_tenant_db_session("admin") as session:
        # Find user by username (which is the email)
        result = await session.execute(
            select(User).where(User.email == data.username)  # Using username from form data
        )
        user = result.scalar_one_or_none()

        if not user or not AuthService.verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user.is_active:
            raise HTTPException(status_code=401, detail="User is inactive")

        # Get or create API key for user
        result = await session.execute(
            select(APIKey).where(
                APIKey.user_id == user.id,
                APIKey.tenant_id == "admin",
                APIKey.is_active == True
            )
        )
        api_key = result.scalar_one_or_none()

        if not api_key:
            # Create new API key
            api_key_str = AuthService.create_api_key()
            api_key = APIKey(
                id=str(uuid.uuid4()),
                tenant_id="admin",
                user_id=user.id,
                name=f"{user.name}'s API Key",
                key_hash=AuthService.hash_api_key(api_key_str),
                permissions={"scopes": ["admin:*"] if user.role == UserRole.ADMIN else ["user:*"]},
                is_active=True,
                quota_limit=500000,  # Set appropriate quota
            )
            session.add(api_key)
            await session.commit()
        else:
            # Use existing API key
            api_key_str = api_key.key_hash  # This is not ideal but we need the original key

        # Create access token
        access_token = AuthService.create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            api_key=api_key_str,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
            }
        )

@router.post("/register", response_model=AuthResponse)
async def register(data: RegisterData) -> AuthResponse:
    """Register new user"""
    async with get_tenant_db_session("admin") as session:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.email == data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email=data.email,
            name=data.name,
            password_hash=AuthService.hash_password(data.password),
            role=UserRole.USER,
            is_active=True,
            quota_limit=100000,  # Set appropriate quota for new users
            current_quota_usage=0,
            settings={},
        )
        session.add(user)

        # Create API key
        api_key_str = AuthService.create_api_key()
        api_key = APIKey(
            id=str(uuid.uuid4()),
            tenant_id="admin",
            user_id=user_id,
            name=f"{data.name}'s API Key",
            key_hash=AuthService.hash_api_key(api_key_str),
            permissions={"scopes": ["user:*"]},
            is_active=True,
            quota_limit=100000,  # Set appropriate quota
        )
        session.add(api_key)
        
        await session.commit()

        # Create access token
        access_token = AuthService.create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            api_key=api_key_str,
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
            }
        )

@router.post("/logout")
async def logout():
    """Logout user"""
    # JWT tokens are stateless, so we just return success
    # Client should remove the token
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserData)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserData:
    """Get current user profile"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value
    }