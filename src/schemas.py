from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# Base Models
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


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
    object: str = "list"
    data: List[ModelInfo]


# Tenant Schemas
class TenantBase(BaseModel):
    name: str
    quota_limit: int
    config: Dict[str, Any] = {}


class TenantCreate(TenantBase):
    id: str
    db_name: str


class TenantUpdate(TenantBase):
    pass


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


class APIKeyResponse(APIKeyBase, TimestampMixin):
    id: str
    tenant_id: str
    is_active: bool
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Error Responses
class HTTPValidationError(BaseModel):
    detail: List[Dict[str, Any]]


class ErrorResponse(BaseModel):
    error: Dict[str, Any]


# Chat Completion Schemas
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    n: Optional[int] = 1
    stream: Optional[bool] = False
    stop: Optional[List[str]] = None
    max_tokens: Optional[int] = None
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
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
