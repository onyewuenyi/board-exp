import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient):
    """Test creating a new task."""
    response = await client.post(
        "/api/tasks",
        json={
            "title": "New Task",
            "status": "todo",
            "priority": "high",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Task"
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_create_task_with_assignee(client: AsyncClient, sample_user: dict):
    """Test creating a task with an assignee."""
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Assigned Task",
            "assigned_user_id": sample_user["id"],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["assigned_user_id"] == sample_user["id"]
    assert data["assignee"]["id"] == sample_user["id"]


@pytest.mark.asyncio
async def test_create_task_with_invalid_user(client: AsyncClient):
    """Test that assigning to non-existent user fails."""
    response = await client.post(
        "/api/tasks",
        json={
            "title": "Bad Task",
            "assigned_user_id": 99999,
        },
    )
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_tasks(client: AsyncClient, sample_task: dict):
    """Test listing all tasks."""
    response = await client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == sample_task["title"]


@pytest.mark.asyncio
async def test_filter_tasks_by_status(client: AsyncClient, sample_user: dict):
    """Test filtering tasks by status."""
    # Create tasks with different statuses
    await client.post("/api/tasks", json={"title": "Todo 1", "status": "todo"})
    await client.post("/api/tasks", json={"title": "Done 1", "status": "done"})
    await client.post("/api/tasks", json={"title": "Todo 2", "status": "todo"})

    response = await client.get("/api/tasks?status=todo")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 2
    assert all(t["status"] == "todo" for t in tasks)


@pytest.mark.asyncio
async def test_filter_tasks_by_priority(client: AsyncClient):
    """Test filtering tasks by priority."""
    await client.post("/api/tasks", json={"title": "High 1", "priority": "high"})
    await client.post("/api/tasks", json={"title": "Low 1", "priority": "low"})

    response = await client.get("/api/tasks?priority=high")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 1
    assert tasks[0]["priority"] == "high"


@pytest.mark.asyncio
async def test_sort_tasks_by_priority(client: AsyncClient):
    """Test sorting tasks by priority."""
    await client.post("/api/tasks", json={"title": "Low", "priority": "low"})
    await client.post("/api/tasks", json={"title": "Urgent", "priority": "urgent"})
    await client.post("/api/tasks", json={"title": "Med", "priority": "med"})

    response = await client.get("/api/tasks?sort_by=priority&sort_order=asc")
    assert response.status_code == 200
    tasks = response.json()
    priorities = [t["priority"] for t in tasks]
    assert priorities == ["urgent", "med", "low"]


@pytest.mark.asyncio
async def test_get_task_by_id(client: AsyncClient, sample_task: dict):
    """Test getting a task by ID."""
    response = await client.get(f"/api/tasks/{sample_task['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_task["id"]
    assert "blocking" in data
    assert "blocked_by" in data


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, sample_task: dict):
    """Test updating a task."""
    response = await client.put(
        f"/api/tasks/{sample_task['id']}",
        json={"status": "done", "priority": "urgent"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "done"
    assert data["priority"] == "urgent"


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, sample_task: dict):
    """Test deleting a task."""
    response = await client.delete(f"/api/tasks/{sample_task['id']}")
    assert response.status_code == 204

    response = await client.get(f"/api/tasks/{sample_task['id']}")
    assert response.status_code == 404
