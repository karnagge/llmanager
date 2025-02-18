"""Tenant-specific schema

Revision ID: 20250213_tenant
Revises: 20250213_init
Create Date: 2025-02-13 14:36:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250213_tenant"
down_revision = "20250213_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums
    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'user', 'readonly')")
    op.execute(
        "CREATE TYPE model_provider AS ENUM ('openai', 'azure', 'google', 'aws', 'local')"
    )

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "user", "readonly", name="user_role"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("quota_limit", sa.Integer()),
        sa.Column("current_quota_usage", sa.Integer(), nullable=False, default=0),
        sa.Column(
            "settings", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column("last_login", sa.DateTime(timezone=True)),
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

    # Usage logs table
    op.create_table(
        "usage_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("request_id", sa.String(36), nullable=False),
        sa.Column("model", sa.String(255), nullable=False),
        sa.Column(
            "provider",
            sa.Enum("openai", "azure", "google", "aws", "local", name="model_provider"),
            nullable=False,
        ),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("cost", sa.Float(), nullable=False),
        sa.Column(
            "usage_data", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
    )

    # Chat sessions table
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("model", sa.String(255), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False, default=0),
        sa.Column("total_messages", sa.Integer(), nullable=False, default=0),
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

    # Chat messages table
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "session_id",
            sa.String(36),
            sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content", sa.String(4096), nullable=False),
        sa.Column("tokens", sa.Integer(), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "metadata", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
    )

    # Model configurations table
    op.create_table(
        "model_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("model_name", sa.String(255), nullable=False),
        sa.Column(
            "provider",
            sa.Enum("openai", "azure", "google", "aws", "local", name="model_provider"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("priority", sa.Integer(), nullable=False, default=0),
        sa.Column(
            "config", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column(
            "rate_limit", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
        sa.Column("cost_per_token", sa.Float(), nullable=False),
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

    # Cache entries table
    op.create_table(
        "cache_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("key_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("response", postgresql.JSON(none_as_null=True), nullable=False),
        sa.Column("tokens", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "metadata", postgresql.JSON(none_as_null=True), nullable=False, default={}
        ),
    )

    # Create indexes
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_role", "users", ["role"])
    op.create_index("idx_usage_logs_user_id", "usage_logs", ["user_id"])
    op.create_index("idx_usage_logs_timestamp", "usage_logs", ["timestamp"])
    op.create_index("idx_usage_logs_model", "usage_logs", ["model"])
    op.create_index("idx_chat_sessions_user_id", "chat_sessions", ["user_id"])
    op.create_index("idx_chat_messages_session_id", "chat_messages", ["session_id"])
    op.create_index("idx_chat_messages_timestamp", "chat_messages", ["timestamp"])
    op.create_index("idx_model_configs_model_name", "model_configs", ["model_name"])
    op.create_index("idx_model_configs_provider", "model_configs", ["provider"])
    op.create_index("idx_cache_entries_key_hash", "cache_entries", ["key_hash"])
    op.create_index("idx_cache_entries_expires_at", "cache_entries", ["expires_at"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_cache_entries_expires_at")
    op.drop_index("idx_cache_entries_key_hash")
    op.drop_index("idx_model_configs_provider")
    op.drop_index("idx_model_configs_model_name")
    op.drop_index("idx_chat_messages_timestamp")
    op.drop_index("idx_chat_messages_session_id")
    op.drop_index("idx_chat_sessions_user_id")
    op.drop_index("idx_usage_logs_model")
    op.drop_index("idx_usage_logs_timestamp")
    op.drop_index("idx_usage_logs_user_id")
    op.drop_index("idx_users_role")
    op.drop_index("idx_users_email")

    # Drop tables
    op.drop_table("cache_entries")
    op.drop_table("model_configs")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("usage_logs")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE model_provider")
    op.execute("DROP TYPE user_role")
