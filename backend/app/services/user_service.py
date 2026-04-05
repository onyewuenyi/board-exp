from datetime import datetime, timezone

from app import database as db
from app.models.user import UserCreate, UserResponse, UserUpdate


def _compute_display_name(record) -> str:
    """Compute display name from first/last name or fallback to name field."""
    first = record.get("first_name") or ""
    last = record.get("last_name") or ""
    full = f"{first} {last}".strip()
    return full or record.get("name") or "Unknown"


def _record_to_user(record) -> UserResponse:
    """Convert a database record to a UserResponse."""
    return UserResponse(
        id=record["id"],
        name=_compute_display_name(record),
        email=record["email"],
        avatar=record["avatar"],
        first_name=record.get("first_name"),
        middle_name=record.get("middle_name"),
        last_name=record.get("last_name"),
        birthday=record.get("birthday"),
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
    # Compute display name if not provided
    name = user.name
    if not name:
        first = user.first_name or ""
        last = user.last_name or ""
        name = f"{first} {last}".strip() or "Unknown"

    row = await db.fetch_one(
        """
        INSERT INTO users (name, email, avatar, first_name, middle_name, last_name, birthday)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        """,
        name,
        user.email,
        user.avatar,
        user.first_name,
        user.middle_name,
        user.last_name,
        user.birthday,
    )
    return _record_to_user(row)


async def update_user(user_id: int, user: UserUpdate) -> UserResponse | None:
    """Update an existing user."""
    existing = await get_user_by_id(user_id)
    if existing is None:
        return None

    # Build update query dynamically based on provided fields
    updates = []
    values = []
    param_idx = 1

    field_map = {
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar,
        "first_name": user.first_name,
        "middle_name": user.middle_name,
        "last_name": user.last_name,
        "birthday": user.birthday,
    }

    for field, value in field_map.items():
        if value is not None:
            updates.append(f"{field} = ${param_idx}")
            values.append(value)
            param_idx += 1

    # Auto-compute display name if first/last changed
    if user.first_name is not None or user.last_name is not None:
        first = user.first_name if user.first_name is not None else (existing.first_name or "")
        last = user.last_name if user.last_name is not None else (existing.last_name or "")
        computed_name = f"{first} {last}".strip() or "Unknown"
        if user.name is None:
            updates.append(f"name = ${param_idx}")
            values.append(computed_name)
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
