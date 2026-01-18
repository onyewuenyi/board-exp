from datetime import datetime, timezone

from app import database as db
from app.models.subtask import SubtaskCreate, SubtaskResponse, SubtaskUpdate


def _record_to_subtask(record) -> SubtaskResponse:
    """Convert a database record to a SubtaskResponse."""
    return SubtaskResponse(
        id=record["id"],
        task_id=record["task_id"],
        title=record["title"],
        completed=record["completed"],
        created_at=record["created_at"],
        updated_at=record["updated_at"],
    )


async def get_subtasks_for_task(task_id: int) -> list[SubtaskResponse]:
    """Get all subtasks for a task."""
    rows = await db.fetch_all(
        "SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC",
        task_id,
    )
    return [_record_to_subtask(row) for row in rows]


async def create_subtask(task_id: int, subtask: SubtaskCreate) -> SubtaskResponse:
    """Create a new subtask for a task."""
    # Verify task exists
    task = await db.fetch_one("SELECT id FROM tasks WHERE id = $1", task_id)
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    row = await db.fetch_one(
        """
        INSERT INTO subtasks (task_id, title, completed)
        VALUES ($1, $2, FALSE)
        RETURNING *
        """,
        task_id,
        subtask.title,
    )
    return _record_to_subtask(row)


async def update_subtask(subtask_id: int, update: SubtaskUpdate) -> SubtaskResponse | None:
    """Update a subtask."""
    existing = await db.fetch_one("SELECT * FROM subtasks WHERE id = $1", subtask_id)
    if existing is None:
        return None

    updates = []
    values = []
    param_idx = 1

    if update.title is not None:
        updates.append(f"title = ${param_idx}")
        values.append(update.title)
        param_idx += 1

    if update.completed is not None:
        updates.append(f"completed = ${param_idx}")
        values.append(update.completed)
        param_idx += 1

    if not updates:
        return _record_to_subtask(existing)

    updates.append(f"updated_at = ${param_idx}")
    values.append(datetime.now(timezone.utc))
    param_idx += 1

    values.append(subtask_id)

    query = f"""
        UPDATE subtasks
        SET {', '.join(updates)}
        WHERE id = ${param_idx}
        RETURNING *
    """

    row = await db.fetch_one(query, *values)
    return _record_to_subtask(row)


async def delete_subtask(subtask_id: int) -> bool:
    """Delete a subtask. Returns True if subtask was deleted."""
    result = await db.execute("DELETE FROM subtasks WHERE id = $1", subtask_id)
    return result == "DELETE 1"
