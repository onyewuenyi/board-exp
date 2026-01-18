"""Create subtasks and links tables

Revision ID: 005
Revises: 004
Create Date: 2025-01-16

"""
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subtasks table
    op.execute("""
        CREATE TABLE subtasks (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
    """)

    # Create task_links table
    op.execute("""
        CREATE TABLE task_links (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            title VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_task_links_task_id ON task_links(task_id);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS task_links CASCADE;")
    op.execute("DROP TABLE IF EXISTS subtasks CASCADE;")
