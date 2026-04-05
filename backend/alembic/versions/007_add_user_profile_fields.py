"""Add profile fields to users table

Revision ID: 007
Revises: 006
Create Date: 2026-04-01

"""
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
        ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    """)


def downgrade():
    op.execute("""
        ALTER TABLE users DROP COLUMN IF EXISTS first_name;
        ALTER TABLE users DROP COLUMN IF EXISTS middle_name;
        ALTER TABLE users DROP COLUMN IF EXISTS last_name;
        ALTER TABLE users DROP COLUMN IF EXISTS birthday;
        ALTER TABLE users ALTER COLUMN avatar TYPE VARCHAR(500);
        ALTER TABLE users ALTER COLUMN email SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    """)
