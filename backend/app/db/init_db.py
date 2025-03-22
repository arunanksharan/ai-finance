"""
Database initialization script.
"""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import Base, engine

logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Initialize the database.
    """
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
