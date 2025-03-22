"""
User model for the application.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    User model.
    
    Attributes:
        id: User ID.
        email: User email.
        hashed_password: Hashed password.
        is_active: Whether the user is active.
        is_verified: Whether the user is verified.
        is_superuser: Whether the user is a superuser.
        first_name: User first name.
        last_name: User last name.
        created_at: User creation timestamp.
        updated_at: User update timestamp.
    """
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(length=320), unique=True, index=True, nullable=False)
    hashed_password = Column(String(length=1024), nullable=False)
    is_active = Column(bool, default=True, nullable=False)
    is_verified = Column(bool, default=False, nullable=False)
    is_superuser = Column(bool, default=False, nullable=False)
    
    # Additional fields
    first_name = Column(String(length=50), nullable=True)
    last_name = Column(String(length=50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
