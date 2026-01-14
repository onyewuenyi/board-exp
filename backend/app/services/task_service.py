from datetime import datetime, timezone

from app import database as db
from app.models.task import TaskCreate, TaskFilterParams, TaskResponse, TaskUpdate
from app.models.user import UserResponse


def _record_to_task(record, assignee: UserResponse | None = None) -> TaskResponse:
    """Convert a database record to a TaskResponse."""
    return TaskResponse(
        id=record["id"],
        title=record["title"],
        description=record["description"],
        assigned_user_id=record["assigned_user_id"],
        due_date=record["due_date"],
        status=record["status"],
        priority=record["priority"],
        task_type=record["task_type"],
        tags=record["tags"] or [],
        created_at=record["created_at"],
        updated_at=record["updated_at"],
        assignee=assignee,
        blocking=[],
        blocked_by=[],
    )


async def _get_task_dependencies(task_id: int) -> tuple[list[int], list[int]]:
    """Get blocking and blocked_by task IDs for a task."""
    # Tasks that this task blocks (other tasks depend on this one)
    blocking_rows = await db.fetch_all(
        "SELECT task_id FROM dependencies WHERE depends_on_task_id = $1",
        task_id,
    )
    blocking = [row["task_id"] for row in blocking_rows]

    # Tasks that block this task (this task depends on them)
    blocked_by_rows = await db.fetch_all(
        "SELECT depends_on_task_id FROM dependencies WHERE task_id = $1",
        task_id,
    )
    blocked_by = [row["depends_on_task_id"] for row in blocked_by_rows]

    return blocking, blocked_by


async def _get_assignee(user_id: int | None) -> UserResponse | None:
    """Get assignee user if assigned."""
    if user_id is None:
        return None

    row = await db.fetch_one("SELECT * FROM users WHERE id = $1", user_id)
    if row is None:
        return None

    return UserResponse(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        avatar=row["avatar"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


async def get_tasks(filters: TaskFilterParams) -> list[TaskResponse]:
    """Get all tasks with optional filtering and sorting."""
    query = "SELECT * FROM tasks WHERE 1=1"
    params: list = []
    param_idx = 1

    if filters.status is not None:
        query += f" AND status = ${param_idx}"
        params.append(filters.status)
        param_idx += 1

    if filters.assigned_user_id is not None:
        query += f" AND assigned_user_id = ${param_idx}"
        params.append(filters.assigned_user_id)
        param_idx += 1

    if filters.due_date_from is not None:
        query += f" AND due_date >= ${param_idx}"
        params.append(filters.due_date_from)
        param_idx += 1

    if filters.due_date_to is not None:
        query += f" AND due_date <= ${param_idx}"
        params.append(filters.due_date_to)
        param_idx += 1

    if filters.priority is not None:
        query += f" AND priority = ${param_idx}"
        params.append(filters.priority)
        param_idx += 1

    # Handle sorting
    if filters.sort_by == "priority":
        # Custom priority ordering
        priority_order = """
            CASE priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'med' THEN 3
                WHEN 'low' THEN 4
                WHEN 'none' THEN 5
            END
        """
        query += f" ORDER BY {priority_order} {filters.sort_order.upper()}"
    elif filters.sort_by == "due_date":
        # NULL dates at the end
        null_order = "NULLS LAST" if filters.sort_order == "asc" else "NULLS FIRST"
        query += f" ORDER BY due_date {filters.sort_order.upper()} {null_order}"
    else:
        query += f" ORDER BY created_at {filters.sort_order.upper()}"

    rows = await db.fetch_all(query, *params)

    tasks = []
    for row in rows:
        assignee = await _get_assignee(row["assigned_user_id"])
        task = _record_to_task(row, assignee)
        blocking, blocked_by = await _get_task_dependencies(row["id"])
        task.blocking = blocking
        task.blocked_by = blocked_by
        tasks.append(task)

    return tasks


async def get_task_by_id(task_id: int) -> TaskResponse | None:
    """Get a task by ID with dependencies."""
    row = await db.fetch_one("SELECT * FROM tasks WHERE id = $1", task_id)
    if row is None:
        return None

    assignee = await _get_assignee(row["assigned_user_id"])
    task = _record_to_task(row, assignee)
    blocking, blocked_by = await _get_task_dependencies(task_id)
    task.blocking = blocking
    task.blocked_by = blocked_by

    return task


async def create_task(task: TaskCreate) -> TaskResponse:
    """Create a new task."""
    # Validate assigned_user_id if provided
    if task.assigned_user_id is not None:
        user = await db.fetch_one(
            "SELECT id FROM users WHERE id = $1",
            task.assigned_user_id,
        )
        if user is None:
            raise ValueError(f"User {task.assigned_user_id} not found")

    row = await db.fetch_one(
        """
        INSERT INTO tasks (title, description, assigned_user_id, due_date,
                          status, priority, task_type, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        """,
        task.title,
        task.description,
        task.assigned_user_id,
        task.due_date,
        task.status,
        task.priority,
        task.task_type,
        task.tags,
    )

    return await get_task_by_id(row["id"])


async def update_task(task_id: int, task: TaskUpdate) -> TaskResponse | None:
    """Update an existing task."""
    existing = await get_task_by_id(task_id)
    if existing is None:
        return None

    # Validate assigned_user_id if provided
    if task.assigned_user_id is not None:
        user = await db.fetch_one(
            "SELECT id FROM users WHERE id = $1",
            task.assigned_user_id,
        )
        if user is None:
            raise ValueError(f"User {task.assigned_user_id} not found")

    # Build update query dynamically
    updates = []
    values = []
    param_idx = 1

    field_map = {
        "title": task.title,
        "description": task.description,
        "assigned_user_id": task.assigned_user_id,
        "due_date": task.due_date,
        "status": task.status,
        "priority": task.priority,
        "task_type": task.task_type,
        "tags": task.tags,
    }

    for field, value in field_map.items():
        if value is not None:
            updates.append(f"{field} = ${param_idx}")
            values.append(value)
            param_idx += 1

    if not updates:
        return existing

    # Add updated_at
    updates.append(f"updated_at = ${param_idx}")
    values.append(datetime.now(timezone.utc))
    param_idx += 1

    values.append(task_id)

    query = f"""
        UPDATE tasks
        SET {', '.join(updates)}
        WHERE id = ${param_idx}
        RETURNING *
    """

    await db.fetch_one(query, *values)
    return await get_task_by_id(task_id)


async def delete_task(task_id: int) -> bool:
    """Delete a task. Returns True if task was deleted."""
    result = await db.execute("DELETE FROM tasks WHERE id = $1", task_id)
    return result == "DELETE 1"
