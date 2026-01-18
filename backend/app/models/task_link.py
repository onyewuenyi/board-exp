from datetime import datetime

from pydantic import BaseModel


class TaskLinkBase(BaseModel):
    """Base task link fields."""

    url: str
    title: str | None = None


class TaskLinkCreate(TaskLinkBase):
    """Fields required to create a task link."""

    pass


class TaskLinkResponse(TaskLinkBase):
    """Task link data returned from API."""

    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True
