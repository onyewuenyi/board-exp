from datetime import datetime, timezone

from app import database as db
from app.models.user import UserCreate, UserResponse, UserUpdate


def _record_to_user(record) -> UserResponse:
    """Convert a database record to a UserResponse."""
    return UserResponse(
        id=record["id"],
        name=record["name"],
        email=record["email"],
        avatar=record["avatar"],
        created_at=record["created_at"],
        updated_at=record["updated_at"],
    )


async def get_users() -> list[UserResponse]:
    """Get all users."""
    rows = await db.fetch_all(
        "SELECT * FROM users ORDER BY created_at DESC"
    )
    return [_record_to_user(row) for row in rows]


async def get_user_by_id(user_id: int) -> UserResponse | None:
    """Get a user by ID."""
    row = await db.fetch_one("SELECT * FROM users WHERE id = $1", user_id)
    if row is None:
        return None
    return _record_to_user(row)


async def get_user_by_email(email: str) -> UserResponse | None:
    """Get a user by email."""
    row = await db.fetch_one("SELECT * FROM users WHERE email = $1", email)
    if row is None:
        return None
    return _record_to_user(row)


async def create_user(user: UserCreate) -> UserResponse:
    """Create a new user."""
    row = await db.fetch_one(
        """
        INSERT INTO users (name, email, avatar)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        user.name,
        user.email,
        user.avatar,
    )
    return _record_to_user(row)


async def update_user(user_id: int, user: UserUpdate) -> UserResponse | None:
    """Update an existing user."""
    # First check if user exists
    existing = await get_user_by_id(user_id)
    if existing is None:
        return None

    # Build update query dynamically based on provided fields
    updates = []
    values = []
    param_idx = 1

    if user.name is not None:
        updates.append(f"name = ${param_idx}")
        values.append(user.name)
        param_idx += 1

    if user.email is not None:
        updates.append(f"email = ${param_idx}")
        values.append(user.email)
        param_idx += 1

    if user.avatar is not None:
        updates.append(f"avatar = ${param_idx}")
        values.append(user.avatar)
        param_idx += 1

    if not updates:
        return existing

    # Add updated_at
    updates.append(f"updated_at = ${param_idx}")
    values.append(datetime.now(timezone.utc))
    param_idx += 1

    # Add user_id for WHERE clause
    values.append(user_id)

    query = f"""
        UPDATE users
        SET {', '.join(updates)}
        WHERE id = ${param_idx}
        RETURNING *
    """

    row = await db.fetch_one(query, *values)
    return _record_to_user(row)


async def delete_user(user_id: int) -> bool:
    """Delete a user. Returns True if user was deleted."""
    result = await db.execute("DELETE FROM users WHERE id = $1", user_id)
    return result == "DELETE 1"
