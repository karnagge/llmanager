"""Initial migration

Revision ID: 20250213_init
Revises:
Create Date: 2025-02-13 14:35:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250213_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # System tables
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("db_name", sa.String(255), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("quota_limit", sa.Integer(), nullable=False),
        sa.Column("current_quota_usage", sa.Integer(), nullable=False, default=0),
        sa.Column(
            "config", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "api_keys",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("last_used_at", sa.DateTime(timezone=True)),
        sa.Column(
            "permissions",
            postgresql.JSON(none_as_null=True),
            nullable=False,
            default={},
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "webhooks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("url", sa.String(1024), nullable=False),
        sa.Column("secret", sa.String(64), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("events", postgresql.ARRAY(sa.String), nullable=False, default=[]),
        sa.Column(
            "metadata", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(255), nullable=False),
        sa.Column("actor", sa.String(255), nullable=False),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("resource_type", sa.String(255), nullable=False),
        sa.Column("resource_id", sa.String(255), nullable=False),
        sa.Column(
            "metadata", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "system_metrics",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("metric_name", sa.String(255), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column(
            "dimensions", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
    )

    # Create indexes
    op.create_index("idx_tenants_is_active", "tenants", ["is_active"])
    op.create_index("idx_api_keys_tenant_id", "api_keys", ["tenant_id"])
    op.create_index("idx_api_keys_key_hash", "api_keys", ["key_hash"])
    op.create_index("idx_webhooks_tenant_id", "webhooks", ["tenant_id"])
    op.create_index("idx_audit_logs_tenant_id", "audit_logs", ["tenant_id"])
    op.create_index("idx_audit_logs_event_type", "audit_logs", ["event_type"])
    op.create_index("idx_system_metrics_timestamp", "system_metrics", ["timestamp"])
    op.create_index("idx_system_metrics_name", "system_metrics", ["metric_name"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_system_metrics_name")
    op.drop_index("idx_system_metrics_timestamp")
    op.drop_index("idx_audit_logs_event_type")
    op.drop_index("idx_audit_logs_tenant_id")
    op.drop_index("idx_webhooks_tenant_id")
    op.drop_index("idx_api_keys_key_hash")
    op.drop_index("idx_api_keys_tenant_id")
    op.drop_index("idx_tenants_is_active")

    # Drop tables
    op.drop_table("system_metrics")
    op.drop_table("audit_logs")
    op.drop_table("webhooks")
    op.drop_table("api_keys")
    op.drop_table("tenants")
