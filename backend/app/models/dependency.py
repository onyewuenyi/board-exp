from datetime import datetime

from pydantic import BaseModel, model_validator


class DependencyBase(BaseModel):
    """Base dependency fields."""

    task_id: int
    depends_on_task_id: int

    @model_validator(mode="after")
    def check_not_self_referential(self):
        """Ensure a task cannot depend on itself."""
        if self.task_id == self.depends_on_task_id:
            raise ValueError("A task cannot depend on itself")
        return self


class DependencyCreate(DependencyBase):
    """Fields required to create a new dependency."""

    pass


class DependencyResponse(DependencyBase):
    """Dependency data returned from API."""

    id: int
    created_at: datetime

    class Config:
        from_attributes = True
