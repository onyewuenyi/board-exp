"""Create dependencies table

Revision ID: 003
Revises: 002
Create Date: 2024-01-01

"""
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE dependencies (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(task_id, depends_on_task_id),
            CHECK (task_id != depends_on_task_id)
        );

        CREATE INDEX idx_dependencies_task_id ON dependencies(task_id);
        CREATE INDEX idx_dependencies_depends_on ON dependencies(depends_on_task_id);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS dependencies CASCADE;")
