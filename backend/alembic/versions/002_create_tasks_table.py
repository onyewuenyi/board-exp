"""Create tasks table

Revision ID: 002
Revises: 001
Create Date: 2024-01-01

"""
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            due_date DATE,
            status VARCHAR(20) NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in-progress', 'done')),
            priority VARCHAR(10) NOT NULL DEFAULT 'none'
                CHECK (priority IN ('urgent', 'high', 'med', 'low', 'none')),
            task_type VARCHAR(20) DEFAULT 'other'
                CHECK (task_type IN ('chore', 'errand', 'homework', 'appointment', 'other')),
            tags TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_assigned_user ON tasks(assigned_user_id);
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX idx_tasks_priority ON tasks(priority);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS tasks CASCADE;")
