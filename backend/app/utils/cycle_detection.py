from app import database as db


async def would_create_cycle(task_id: int, depends_on_task_id: int) -> bool:
    """
    Check if adding a dependency would create a cycle using DFS.

    A cycle would be created if depends_on_task_id can reach task_id
    through existing dependencies.

    Args:
        task_id: The task that would depend on another
        depends_on_task_id: The task that would be depended upon

    Returns:
        True if adding this dependency would create a cycle
    """
    visited: set[int] = set()

    async def dfs(current_id: int) -> bool:
        # If we reached the original task, we found a cycle
        if current_id == task_id:
            return True

        # Skip already visited nodes
        if current_id in visited:
            return False

        visited.add(current_id)

        # Get all tasks that current_id depends on
        deps = await db.fetch_all(
            "SELECT depends_on_task_id FROM dependencies WHERE task_id = $1",
            current_id,
        )

        # Recursively check each dependency
        for dep in deps:
            if await dfs(dep["depends_on_task_id"]):
                return True

        return False

    # Start DFS from the task we would depend on
    return await dfs(depends_on_task_id)
