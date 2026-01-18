from app import database as db
from app.models.task_link import TaskLinkCreate, TaskLinkResponse


def _record_to_link(record) -> TaskLinkResponse:
    """Convert a database record to a TaskLinkResponse."""
    return TaskLinkResponse(
        id=record["id"],
        task_id=record["task_id"],
        url=record["url"],
        title=record["title"],
        created_at=record["created_at"],
    )


async def get_links_for_task(task_id: int) -> list[TaskLinkResponse]:
    """Get all links for a task."""
    rows = await db.fetch_all(
        "SELECT * FROM task_links WHERE task_id = $1 ORDER BY created_at ASC",
        task_id,
    )
    return [_record_to_link(row) for row in rows]


async def create_link(task_id: int, link: TaskLinkCreate) -> TaskLinkResponse:
    """Create a new link for a task."""
    # Verify task exists
    task = await db.fetch_one("SELECT id FROM tasks WHERE id = $1", task_id)
    if task is None:
        raise ValueError(f"Task {task_id} not found")

    row = await db.fetch_one(
        """
        INSERT INTO task_links (task_id, url, title)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        task_id,
        link.url,
        link.title,
    )
    return _record_to_link(row)


async def delete_link(link_id: int) -> bool:
    """Delete a link. Returns True if link was deleted."""
    result = await db.execute("DELETE FROM task_links WHERE id = $1", link_id)
    return result == "DELETE 1"
