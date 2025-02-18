from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON, Boolean, DateTime, ForeignKey, ForeignKeyConstraint,
    Integer, String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from src.core.database import Base


class TimestampMixin:
    """Mixin to add creation and update timestamps"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Tenant(Base, TimestampMixin):
    """Tenant model for multi-tenancy support"""

    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    db_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quota_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    current_quota_usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    api_keys: Mapped[list["APIKey"]] = relationship(back_populates="tenant")
    webhooks: Mapped[list["Webhook"]] = relationship(back_populates="tenant")


class APIKey(Base, TimestampMixin):
    """API key model for authentication"""

    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    permissions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    quota_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_quota_usage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    tenant: Mapped[Tenant] = relationship(back_populates="api_keys")

    # Note: user_id is validated at application level since it references
    # a table in a different database


class Webhook(Base, TimestampMixin):
    """Webhook configuration for notifications"""

    __tablename__ = "webhooks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    secret: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    events: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    webhook_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Relationships
    tenant: Mapped[Tenant] = relationship(back_populates="webhooks")


class AuditLog(Base, TimestampMixin):
    """Audit log for system-level events"""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False)
    audit_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class SystemMetrics(Base):
    """System-wide metrics for monitoring"""

    __tablename__ = "system_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    metric_name: Mapped[str] = mapped_column(String(255), nullable=False)
    metric_value: Mapped[float] = mapped_column(nullable=False)
    dimensions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


class BillingEvent(Base, TimestampMixin):
    """Billing events for cost tracking"""

    __tablename__ = "billing_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    description: Mapped[str] = mapped_column(String(1024), nullable=False)
    billing_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
