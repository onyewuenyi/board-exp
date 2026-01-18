from datetime import datetime

from pydantic import BaseModel


class FamilyBase(BaseModel):
    """Base family fields."""
    name: str  # Usually default to "The [Lastname] Family"


class FamilyCreate(FamilyBase):
    """Fields required to create a new family."""
    pass


class FamilyResponse(FamilyBase):
    """Family data returned from API."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
