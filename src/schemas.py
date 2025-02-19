from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    sub: str | None = None

class LoginData(BaseModel):
    email: EmailStr
    password: str

class RegisterData(LoginData):
    name: str

class UserData(BaseModel):
    id: str
    email: str
    name: str
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    api_key: str
    user: UserData

# Error schemas
class ValidationError(BaseModel):
    loc: List[str]
    msg: str
    type: str

class HTTPValidationError(BaseModel):
    detail: List[ValidationError]

class ErrorResponse(BaseModel):
    detail: str

# Model schemas
class ModelInfo(BaseModel):
    id: str
    created: int
    owned_by: str
    permission: List[Dict]
    root: str
    parent: Optional[str]

class ModelsResponse(BaseModel):
    data: List[ModelInfo]

# Chat schemas
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str

class ChatCompletionUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None

class ChatCompletionResponse(BaseModel):
    id: str
    created: int
    model: str
    choices: List[ChatCompletionChoice]
    usage: ChatCompletionUsage

# Tenant schemas
class TenantCreate(BaseModel):
    id: str
    name: str
    quota_limit: int
    config: Dict = {}

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    quota_limit: Optional[int] = None
    is_active: Optional[bool] = None
    config: Optional[Dict] = None

class TenantResponse(BaseModel):
    id: str
    name: str
    quota_limit: int
    current_quota_usage: int
    is_active: bool
    config: Dict

# API Key schemas
class APIKeyCreate(BaseModel):
    name: str
    permissions: Dict
    quota_limit: Optional[int] = None

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    permissions: Dict
    quota_limit: Optional[int] = None
    current_quota_usage: int

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    quota_limit: Optional[int] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    is_active: bool
    role: str
    quota_limit: Optional[int]
    current_quota_usage: int

# Webhook schemas
class WebhookCreate(BaseModel):
    url: str
    secret: str
    events: List[str]

class WebhookUpdate(BaseModel):
    url: Optional[str] = None
    secret: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None

class WebhookResponse(BaseModel):
    id: str
    url: str
    events: List[str]
    is_active: bool
