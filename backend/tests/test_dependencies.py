import pytest
from httpx import AsyncClient

from app import database as db


async def create_task(title: str) -> dict:
    """Helper to create a task directly in the database."""
    row = await db.fetch_one(
        """
        INSERT INTO tasks (title, status, priority)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        title,
        "todo",
        "none",
    )
    return dict(row)


@pytest.mark.asyncio
async def test_create_dependency(client: AsyncClient):
    """Test creating a dependency between tasks."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")

    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["task_id"] == task_a["id"]
    assert data["depends_on_task_id"] == task_b["id"]


@pytest.mark.asyncio
async def test_dependency_appears_in_task(client: AsyncClient):
    """Test that dependencies appear in task response."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")

    # A depends on B
    await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )

    # Check task A shows blocked_by
    response = await client.get(f"/api/tasks/{task_a['id']}")
    data = response.json()
    assert task_b["id"] in data["blocked_by"]

    # Check task B shows blocking
    response = await client.get(f"/api/tasks/{task_b['id']}")
    data = response.json()
    assert task_a["id"] in data["blocking"]


@pytest.mark.asyncio
async def test_self_dependency_rejected(client: AsyncClient):
    """Test that a task cannot depend on itself."""
    task = await create_task("Task A")

    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task["id"],
            "depends_on_task_id": task["id"],
        },
    )
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_duplicate_dependency_rejected(client: AsyncClient):
    """Test that duplicate dependencies are rejected."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")

    # Create first dependency
    await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )

    # Try to create duplicate
    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_simple_cycle_prevented(client: AsyncClient):
    """Test that a simple A->B, B->A cycle is prevented."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")

    # A depends on B
    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )
    assert response.status_code == 201

    # B depends on A (would create cycle)
    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task_b["id"],
            "depends_on_task_id": task_a["id"],
        },
    )
    assert response.status_code == 400
    assert "cycle" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_transitive_cycle_prevented(client: AsyncClient):
    """Test that a transitive A->B->C, C->A cycle is prevented."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")
    task_c = await create_task("Task C")

    # A depends on B
    await client.post(
        "/api/dependencies",
        json={"task_id": task_a["id"], "depends_on_task_id": task_b["id"]},
    )

    # B depends on C
    await client.post(
        "/api/dependencies",
        json={"task_id": task_b["id"], "depends_on_task_id": task_c["id"]},
    )

    # C depends on A (would create cycle: A->B->C->A)
    response = await client.post(
        "/api/dependencies",
        json={"task_id": task_c["id"], "depends_on_task_id": task_a["id"]},
    )
    assert response.status_code == 400
    assert "cycle" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_non_existent_task_dependency_rejected(client: AsyncClient):
    """Test that dependencies with non-existent tasks are rejected."""
    task = await create_task("Task A")

    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task["id"],
            "depends_on_task_id": 99999,
        },
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_delete_dependency(client: AsyncClient):
    """Test deleting a dependency."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")

    # Create dependency
    response = await client.post(
        "/api/dependencies",
        json={
            "task_id": task_a["id"],
            "depends_on_task_id": task_b["id"],
        },
    )
    dep_id = response.json()["id"]

    # Delete it
    response = await client.delete(f"/api/dependencies/{dep_id}")
    assert response.status_code == 204

    # Verify task A no longer shows blocked_by
    response = await client.get(f"/api/tasks/{task_a['id']}")
    data = response.json()
    assert task_b["id"] not in data["blocked_by"]


@pytest.mark.asyncio
async def test_get_dependencies_for_task(client: AsyncClient):
    """Test getting all dependencies for a specific task."""
    task_a = await create_task("Task A")
    task_b = await create_task("Task B")
    task_c = await create_task("Task C")

    # A depends on B
    await client.post(
        "/api/dependencies",
        json={"task_id": task_a["id"], "depends_on_task_id": task_b["id"]},
    )

    # C depends on A
    await client.post(
        "/api/dependencies",
        json={"task_id": task_c["id"], "depends_on_task_id": task_a["id"]},
    )

    # Get dependencies for A (should include both)
    response = await client.get(f"/api/dependencies/task/{task_a['id']}")
    assert response.status_code == 200
    deps = response.json()
    assert len(deps) == 2
