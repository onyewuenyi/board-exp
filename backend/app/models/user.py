from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user fields shared across models."""

    name: str
    email: EmailStr
    avatar: str | None = None


class UserCreate(UserBase):
    """Fields required to create a new user."""

    pass


class UserUpdate(BaseModel):
    """Fields that can be updated on a user."""

    name: str | None = None
    email: EmailStr | None = None
    avatar: str | None = None


class UserResponse(UserBase):
    """User data returned from API."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
