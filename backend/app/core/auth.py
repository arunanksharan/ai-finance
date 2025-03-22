"""
Authentication utilities for the application.
"""
import uuid
from typing import Optional, Union

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    """
    User manager for the application.
    
    Attributes:
        reset_password_token_secret: Secret for reset password tokens.
        verification_token_secret: Secret for verification tokens.
    """
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        """
        Hook called after a user is registered.
        
        Args:
            user: The registered user.
            request: The request that triggered the registration.
        """
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        Hook called after a user requests a password reset.
        
        Args:
            user: The user who requested the password reset.
            token: The password reset token.
            request: The request that triggered the password reset.
        """
        print(f"User {user.id} has requested a password reset with token {token}.")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """
        Hook called after a user requests verification.
        
        Args:
            user: The user who requested verification.
            token: The verification token.
            request: The request that triggered the verification.
        """
        print(f"Verification requested for user {user.id} with token {token}.")


def get_user_db(session: AsyncSession = Depends(get_db)):
    """
    Get user database.
    
    Args:
        session: Database session.
        
    Returns:
        User database.
    """
    yield SQLAlchemyUserDatabase(session, User)


def get_user_manager(user_db=Depends(get_user_db)):
    """
    Get user manager.
    
    Args:
        user_db: User database.
        
    Returns:
        User manager.
    """
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl=f"{settings.API_V1_STR}/auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    """
    Get JWT strategy.
    
    Returns:
        JWT strategy.
    """
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)
current_active_verified_user = fastapi_users.current_user(active=True, verified=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
