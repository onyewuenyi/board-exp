from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """
    Base user fields shared across models.
    Refers to 'ParentUser' in product terminology.
    """

    name: str | None = None
    email: EmailStr | None = None
    avatar: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    birthday: date | None = None
    google_id: str | None = None
    family_id: int | None = None


class UserCreate(UserBase):
    """Fields required to create a new user."""

    pass


class UserUpdate(BaseModel):
    """Fields that can be updated on a user."""

    name: str | None = None
    email: EmailStr | None = None
    avatar: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    birthday: date | None = None
    family_id: int | None = None


class UserResponse(UserBase):
    """User data returned from API."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
