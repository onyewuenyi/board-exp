"""create_families_and_update_users

Revision ID: 004
Revises: 003
Create Date: 2026-01-16 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create family_accounts table
    op.create_table(
        "family_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
    )

    # Add columns to users table
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("family_id", sa.Integer(), nullable=True))

    # Create index for google_id since we look up by it
    op.create_index(op.f("ix_users_google_id"), "users", ["google_id"], unique=True)

    # Add foreign key for family_id
    op.create_foreign_key(None, "users", "family_accounts", ["family_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint(None, "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_google_id"), table_name="users")
    op.drop_column("users", "family_id")
    op.drop_column("users", "google_id")
    op.drop_table("family_accounts")
