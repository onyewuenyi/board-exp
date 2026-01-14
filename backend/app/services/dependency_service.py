from app import database as db
from app.models.dependency import DependencyCreate, DependencyResponse
from app.utils.cycle_detection import would_create_cycle


def _record_to_dependency(record) -> DependencyResponse:
    """Convert a database record to a DependencyResponse."""
    return DependencyResponse(
        id=record["id"],
        task_id=record["task_id"],
        depends_on_task_id=record["depends_on_task_id"],
        created_at=record["created_at"],
    )


async def get_dependencies() -> list[DependencyResponse]:
    """Get all dependencies."""
    rows = await db.fetch_all(
        "SELECT * FROM dependencies ORDER BY created_at DESC"
    )
    return [_record_to_dependency(row) for row in rows]


async def get_dependencies_for_task(task_id: int) -> list[DependencyResponse]:
    """Get all dependencies for a specific task."""
    rows = await db.fetch_all(
        """
        SELECT * FROM dependencies
        WHERE task_id = $1 OR depends_on_task_id = $1
        ORDER BY created_at DESC
        """,
        task_id,
    )
    return [_record_to_dependency(row) for row in rows]


async def get_dependency_by_id(dependency_id: int) -> DependencyResponse | None:
    """Get a dependency by ID."""
    row = await db.fetch_one(
        "SELECT * FROM dependencies WHERE id = $1",
        dependency_id,
    )
    if row is None:
        return None
    return _record_to_dependency(row)


async def create_dependency(dependency: DependencyCreate) -> DependencyResponse:
    """Create a new dependency with cycle detection."""
    # Validate that both tasks exist
    task = await db.fetch_one(
        "SELECT id FROM tasks WHERE id = $1",
        dependency.task_id,
    )
    if task is None:
        raise ValueError(f"Task {dependency.task_id} not found")

    depends_on_task = await db.fetch_one(
        "SELECT id FROM tasks WHERE id = $1",
        dependency.depends_on_task_id,
    )
    if depends_on_task is None:
        raise ValueError(f"Task {dependency.depends_on_task_id} not found")

    # Check for existing dependency
    existing = await db.fetch_one(
        """
        SELECT id FROM dependencies
        WHERE task_id = $1 AND depends_on_task_id = $2
        """,
        dependency.task_id,
        dependency.depends_on_task_id,
    )
    if existing is not None:
        raise ValueError("Dependency already exists")

    # Check for cycle
    if await would_create_cycle(dependency.task_id, dependency.depends_on_task_id):
        raise ValueError(
            "Adding this dependency would create a cycle. "
            f"Task {dependency.depends_on_task_id} already depends on task {dependency.task_id} "
            "directly or indirectly."
        )

    row = await db.fetch_one(
        """
        INSERT INTO dependencies (task_id, depends_on_task_id)
        VALUES ($1, $2)
        RETURNING *
        """,
        dependency.task_id,
        dependency.depends_on_task_id,
    )

    return _record_to_dependency(row)


async def delete_dependency(dependency_id: int) -> bool:
    """Delete a dependency. Returns True if dependency was deleted."""
    result = await db.execute(
        "DELETE FROM dependencies WHERE id = $1",
        dependency_id,
    )
    return result == "DELETE 1"
