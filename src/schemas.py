from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field

from src.models.tenant import UserRole


# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


# User Schemas
class UserCreate(BaseModel):
    """User creation request"""

    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    name: str = Field(..., description="User name")
    role: UserRole = Field(default=UserRole.USER, description="User role")
    quota_limit: Optional[int] = Field(None, description="User token quota limit")
    settings: Dict = Field(default_factory=dict, description="User settings")


class UserUpdate(BaseModel):
    """User update request"""

    name: Optional[str] = Field(None, description="User name")
    password: Optional[str] = Field(None, min_length=8, description="New password")
    role: Optional[UserRole] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="User status")
    quota_limit: Optional[int] = Field(None, description="User token quota limit")
    settings: Optional[Dict] = Field(None, description="User settings")


class UserResponse(BaseModel):
    """User response"""

    id: str
    email: str
    name: str
    role: UserRole
    is_active: bool
    quota_limit: Optional[int]
    current_quota_usage: int
    settings: Dict
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    """Token response"""

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """Token data"""

    sub: str
    tenant_id: str
    exp: datetime


# Tenant Schemas
class TenantBase(BaseModel):
    name: str
    quota_limit: int
    config: Dict[str, Any] = {}


class TenantCreate(TenantBase):
    id: str
    db_name: str


class TenantUpdate(BaseModel):
    """Tenant update request"""

    name: Optional[str] = Field(None, description="Tenant name")
    quota_limit: Optional[int] = Field(None, description="Token quota limit")
    is_active: Optional[bool] = Field(None, description="Tenant status")
    config: Optional[Dict] = Field(None, description="Tenant configuration")


class TenantResponse(TenantBase, TimestampMixin):
    id: str
    db_name: str
    is_active: bool
    current_quota_usage: int

    class Config:
        from_attributes = True


# API Key Schemas
class APIKeyBase(BaseModel):
    name: str
    permissions: Dict[str, Any] = {}


class APIKeyCreate(APIKeyBase):
    tenant_id: str
    expires_at: Optional[datetime] = Field(None, description="Expiration date")


class APIKeyResponse(APIKeyBase, TimestampMixin):
    id: str
    tenant_id: str
    key: Optional[str]  # Only included on creation
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Webhook Schemas
class WebhookCreate(BaseModel):
    """Webhook creation request"""

    url: str = Field(..., description="Webhook URL")
    events: List[str] = Field(..., description="Event types to subscribe to")
    metadata: Dict = Field(default_factory=dict, description="Additional metadata")


class WebhookUpdate(BaseModel):
    """Webhook update request"""

    url: Optional[str] = Field(None, description="Webhook URL")
    events: Optional[List[str]] = Field(None, description="Event types")
    is_active: Optional[bool] = Field(None, description="Webhook status")
    metadata: Optional[Dict] = Field(None, description="Additional metadata")


class WebhookResponse(BaseModel):
    """Webhook response"""

    id: str
    url: str
    events: List[str]
    is_active: bool
    metadata: Dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Error Responses
class HTTPValidationError(BaseModel):
    detail: List[Dict[str, Any]]


class ErrorResponse(BaseModel):
    error: Dict[str, Any]


# Model Response Schemas
class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    created: int
    owned_by: str
    permission: List[Dict[str, Any]] = []
    root: Optional[str] = None
    parent: Optional[str] = None


class ModelsResponse(BaseModel):
    data: List[ModelInfo]
    object: str = "list"


# Chat Schemas
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    user: Optional[str] = None


class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: Optional[str] = None


class ChatCompletionUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: ChatCompletionUsage
