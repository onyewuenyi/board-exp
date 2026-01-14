from datetime import date
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.models.task import (
    Priority,
    Status,
    TaskCreate,
    TaskFilterParams,
    TaskResponse,
    TaskUpdate,
)
from app.services import task_service

router = APIRouter()


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status: Status | None = Query(None, description="Filter by status"),
    assigned_user_id: int | None = Query(None, description="Filter by assignee"),
    due_date_from: date | None = Query(None, description="Filter by due date (from)"),
    due_date_to: date | None = Query(None, description="Filter by due date (to)"),
    priority: Priority | None = Query(None, description="Filter by priority"),
    sort_by: Literal["due_date", "priority", "created_at"] = Query(
        "created_at", description="Sort by field"
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort order"),
):
    """Get all tasks with optional filtering and sorting."""
    filters = TaskFilterParams(
        status=status,
        assigned_user_id=assigned_user_id,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        priority=priority,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await task_service.get_tasks(filters)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int):
    """Get a task by ID with its dependencies."""
    task = await task_service.get_task_by_id(task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate):
    """Create a new task."""
    try:
        return await task_service.create_task(task)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task: TaskUpdate):
    """Update a task."""
    try:
        updated = await task_service.update_task(task_id, task)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
    return updated


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int):
    """Delete a task."""
    deleted = await task_service.delete_task(task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
