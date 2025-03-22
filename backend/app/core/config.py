"""
Configuration settings for the application.
"""
import os
from typing import Any, Dict, List, Optional

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings class.
    
    Attributes:
        PROJECT_NAME: Name of the project.
        API_V1_STR: API version string.
        SECRET_KEY: Secret key for JWT token generation.
        ACCESS_TOKEN_EXPIRE_MINUTES: Expiration time for access tokens.
        BACKEND_CORS_ORIGINS: List of allowed CORS origins.
        POSTGRES_SERVER: PostgreSQL server hostname.
        POSTGRES_USER: PostgreSQL username.
        POSTGRES_PASSWORD: PostgreSQL password.
        POSTGRES_DB: PostgreSQL database name.
        SQLALCHEMY_DATABASE_URI: SQLAlchemy database URI.
        SMTP_TLS: Whether to use TLS for SMTP.
        SMTP_PORT: SMTP port.
        SMTP_HOST: SMTP host.
        SMTP_USER: SMTP username.
        SMTP_PASSWORD: SMTP password.
        EMAILS_FROM_EMAIL: Email sender address.
        EMAILS_FROM_NAME: Email sender name.
    """
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    PROJECT_NAME: str = "Finance Tools Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "CHANGE_THIS_TO_A_COMPLEX_SECRET_KEY"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[AnyHttpUrl] | str:
        """
        Validate and assemble CORS origins.
        
        Args:
            v: CORS origins as string or list.
            
        Returns:
            List of CORS origins.
        """
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "finance_db"
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        """
        Assemble database connection URI.
        
        Args:
            v: Database URI.
            values: Settings values.
            
        Returns:
            Assembled database URI.
        """
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.data.get("POSTGRES_USER"),
            password=values.data.get("POSTGRES_PASSWORD"),
            host=values.data.get("POSTGRES_SERVER"),
            path=f"{values.data.get('POSTGRES_DB') or ''}",
        )

    # Email settings
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_USER: Optional[str] = ""
    SMTP_PASSWORD: Optional[str] = ""
    EMAILS_FROM_EMAIL: Optional[str] = ""
    EMAILS_FROM_NAME: Optional[str] = "Finance Tools Platform"


settings = Settings()
