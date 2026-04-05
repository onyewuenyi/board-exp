"""Create task_assignees join table for multi-user assignment

Revision ID: 006
Revises: 005
Create Date: 2026-04-01

"""
from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE task_assignees (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(task_id, user_id)
        );

        CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
        CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
    """)

    # Migrate existing assigned_user_id data
    op.execute("""
        INSERT INTO task_assignees (task_id, user_id)
        SELECT id, assigned_user_id FROM tasks
        WHERE assigned_user_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS task_assignees;")
