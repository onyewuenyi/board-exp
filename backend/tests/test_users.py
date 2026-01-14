import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    """Test creating a new user."""
    response = await client.post(
        "/api/users",
        json={
            "name": "John Doe",
            "email": "john@example.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john@example.com"
    assert data["id"] is not None
    assert data["created_at"] is not None


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient, sample_user: dict):
    """Test that duplicate emails are rejected."""
    response = await client.post(
        "/api/users",
        json={
            "name": "Another User",
            "email": sample_user["email"],
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_users(client: AsyncClient, sample_user: dict):
    """Test listing all users."""
    response = await client.get("/api/users")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == sample_user["email"]


@pytest.mark.asyncio
async def test_get_user_by_id(client: AsyncClient, sample_user: dict):
    """Test getting a user by ID."""
    response = await client.get(f"/api/users/{sample_user['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_user["id"]
    assert data["name"] == sample_user["name"]


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    """Test getting a non-existent user."""
    response = await client.get("/api/users/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient, sample_user: dict):
    """Test updating a user."""
    response = await client.put(
        f"/api/users/{sample_user['id']}",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["email"] == sample_user["email"]


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient, sample_user: dict):
    """Test deleting a user."""
    response = await client.delete(f"/api/users/{sample_user['id']}")
    assert response.status_code == 204

    # Verify user is deleted
    response = await client.get(f"/api/users/{sample_user['id']}")
    assert response.status_code == 404
