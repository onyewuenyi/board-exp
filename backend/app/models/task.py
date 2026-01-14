from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.models.user import UserResponse

Priority = Literal["urgent", "high", "med", "low", "none"]
Status = Literal["todo", "in-progress", "done"]
TaskType = Literal["chore", "errand", "homework", "appointment", "other"]


class TaskBase(BaseModel):
    """Base task fields shared across models."""

    title: str
    description: str | None = None
    assigned_user_id: int | None = None
    due_date: date | None = None
    status: Status = "todo"
    priority: Priority = "none"
    task_type: TaskType = "other"
    tags: list[str] | None = None


class TaskCreate(TaskBase):
    """Fields required to create a new task."""

    pass


class TaskUpdate(BaseModel):
    """Fields that can be updated on a task."""

    title: str | None = None
    description: str | None = None
    assigned_user_id: int | None = None
    due_date: date | None = None
    status: Status | None = None
    priority: Priority | None = None
    task_type: TaskType | None = None
    tags: list[str] | None = None


class TaskResponse(TaskBase):
    """Task data returned from API."""

    id: int
    created_at: datetime
    updated_at: datetime
    assignee: UserResponse | None = None
    blocking: list[int] = []  # Task IDs this task blocks
    blocked_by: list[int] = []  # Task IDs blocking this task

    class Config:
        from_attributes = True


class TaskFilterParams(BaseModel):
    """Query parameters for filtering and sorting tasks."""

    status: Status | None = None
    assigned_user_id: int | None = None
    due_date_from: date | None = None
    due_date_to: date | None = None
    priority: Priority | None = None
    sort_by: Literal["due_date", "priority", "created_at"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
