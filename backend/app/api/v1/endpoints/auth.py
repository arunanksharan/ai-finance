"""
Authentication endpoints.
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.auth import auth_backend, fastapi_users
from app.schemas.user import UserCreate, UserRead, UserUpdate

logger = logging.getLogger(__name__)

router = APIRouter()

# Include fastapi-users auth routes
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/jwt",
    tags=["auth"],
)

# Include fastapi-users register routes
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/register",
    tags=["auth"],
)

# Include fastapi-users reset password routes
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/reset-password",
    tags=["auth"],
)

# Include fastapi-users verify routes
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/verify",
    tags=["auth"],
)

# Include fastapi-users users routes
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)
