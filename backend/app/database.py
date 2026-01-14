from contextlib import asynccontextmanager
from typing import Any

import asyncpg

from app.config import settings

# Global connection pool
pool: asyncpg.Pool | None = None


async def init_db() -> None:
    """Initialize the database connection pool on startup."""
    global pool
    pool = await asyncpg.create_pool(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        min_size=5,
        max_size=20,
        command_timeout=60,
    )


async def close_db() -> None:
    """Close the database connection pool on shutdown."""
    global pool
    if pool:
        await pool.close()
        pool = None


@asynccontextmanager
async def get_connection():
    """Context manager for acquiring a connection from the pool."""
    if pool is None:
        raise RuntimeError("Database pool is not initialized")
    async with pool.acquire() as conn:
        yield conn


async def execute(query: str, *args) -> str:
    """Execute a query (INSERT, UPDATE, DELETE) and return status."""
    async with get_connection() as conn:
        return await conn.execute(query, *args)


async def fetch_one(query: str, *args) -> asyncpg.Record | None:
    """Fetch a single row from the database."""
    async with get_connection() as conn:
        return await conn.fetchrow(query, *args)


async def fetch_all(query: str, *args) -> list[asyncpg.Record]:
    """Fetch multiple rows from the database."""
    async with get_connection() as conn:
        return await conn.fetch(query, *args)


async def fetch_val(query: str, *args) -> Any:
    """Fetch a single value from the database."""
    async with get_connection() as conn:
        return await conn.fetchval(query, *args)
