import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from src.core.database import Base
from src.models.system import TimestampMixin


class UserRole(str, enum.Enum):
    """User role enumeration"""

    ADMIN = "admin"
    USER = "user"
    READONLY = "readonly"


class ModelProvider(str, enum.Enum):
    """Model provider enumeration"""

    OPENAI = "openai"
    AZURE = "azure"
    GOOGLE = "google"
    AWS = "aws"
    LOCAL = "local"


class User(Base, TimestampMixin):
    """User model for tenant-specific users"""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.USER, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quota_limit: Mapped[Optional[int]] = mapped_column(Integer)
    current_quota_usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    usage_logs: Mapped[list["UsageLog"]] = relationship(back_populates="user")


class UsageLog(Base):
    """Log of token usage per request"""

    __tablename__ = "usage_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    request_id: Mapped[str] = mapped_column(String(36), nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[ModelProvider] = mapped_column(Enum(ModelProvider), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    usage_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    user: Mapped[User] = relationship(back_populates="usage_logs")


class ModelConfig(Base, TimestampMixin):
    """Model configuration for the tenant"""

    __tablename__ = "model_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[ModelProvider] = mapped_column(Enum(ModelProvider), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    rate_limit: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    cost_per_token: Mapped[float] = mapped_column(Float, nullable=False)


class ChatSession(Base, TimestampMixin):
    """Chat session for conversation history"""

    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    model: Mapped[str] = mapped_column(String(255), nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    session_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session", order_by="ChatMessage.timestamp"
    )


class ChatMessage(Base):
    """Individual chat message in a session"""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(String(4096), nullable=False)
    tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    message_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    session: Mapped[ChatSession] = relationship(back_populates="messages")


class CacheEntry(Base):
    """Cache for response reuse"""

    __tablename__ = "cache_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    response: Mapped[dict] = mapped_column(JSON, nullable=False)
    tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    cache_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
