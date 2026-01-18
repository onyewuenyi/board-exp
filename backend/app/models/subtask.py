from datetime import datetime

from pydantic import BaseModel


class SubtaskBase(BaseModel):
    """Base subtask fields."""

    title: str


class SubtaskCreate(SubtaskBase):
    """Fields required to create a subtask."""

    pass


class SubtaskUpdate(BaseModel):
    """Fields that can be updated on a subtask."""

    title: str | None = None
    completed: bool | None = None


class SubtaskResponse(SubtaskBase):
    """Subtask data returned from API."""

    id: int
    task_id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
