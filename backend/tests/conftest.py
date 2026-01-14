import asyncio
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app import database as db
from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_test_db():
    """Setup and teardown test database for each test."""
    await db.init_db()

    # Clean tables before each test
    await db.execute("TRUNCATE dependencies, tasks, users RESTART IDENTITY CASCADE")

    yield

    await db.close_db()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for testing API endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
async def sample_user() -> dict:
    """Create a sample user for tests."""
    row = await db.fetch_one(
        """
        INSERT INTO users (name, email, avatar)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        "Test User",
        "test@example.com",
        "https://example.com/avatar.png",
    )
    return dict(row)


@pytest.fixture
async def sample_task(sample_user: dict) -> dict:
    """Create a sample task for tests."""
    row = await db.fetch_one(
        """
        INSERT INTO tasks (title, description, assigned_user_id, status, priority)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        "Test Task",
        "Test description",
        sample_user["id"],
        "todo",
        "high",
    )
    return dict(row)
