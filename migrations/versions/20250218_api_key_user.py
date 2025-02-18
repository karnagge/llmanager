"""add user_id to api_keys

Revision ID: 20250218_api_key_user
Revises: 20250213_tenant
Create Date: 2025-02-18 15:49

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250218_api_key_user'
down_revision = '20250213_tenant'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Add index for user lookups if needed"""
    # Check if index exists
    op.execute("""
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = 'api_keys' 
            AND indexname = 'ix_api_keys_user_id'
        ) THEN
            CREATE INDEX ix_api_keys_user_id ON api_keys (user_id, tenant_id);
        END IF;
    END
    $$;
    """)

def downgrade() -> None:
    """Remove the index if it exists"""
    op.execute("DROP INDEX IF EXISTS ix_api_keys_user_id")