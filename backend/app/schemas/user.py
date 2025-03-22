"""
User schemas for the application.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi_users import schemas
from pydantic import EmailStr, Field


class UserRead(schemas.BaseUser[uuid.UUID]):
    """
    Schema for reading user data.
    
    Attributes:
        id: User ID.
        email: User email.
        is_active: Whether the user is active.
        is_verified: Whether the user is verified.
        is_superuser: Whether the user is a superuser.
        first_name: User first name.
        last_name: User last name.
        created_at: User creation timestamp.
        updated_at: User update timestamp.
    """
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    is_verified: bool
    is_superuser: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserCreate(schemas.BaseUserCreate):
    """
    Schema for creating a user.
    
    Attributes:
        email: User email.
        password: User password.
        first_name: User first name.
        last_name: User last name.
    """
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserUpdate(schemas.BaseUserUpdate):
    """
    Schema for updating a user.
    
    Attributes:
        password: User password.
        email: User email.
        first_name: User first name.
        last_name: User last name.
        is_active: Whether the user is active.
        is_verified: Whether the user is verified.
        is_superuser: Whether the user is a superuser.
    """
    password: Optional[str] = Field(None, min_length=8)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_superuser: Optional[bool] = None
