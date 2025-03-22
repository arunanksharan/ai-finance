"""
SACCR (Standardized Approach for Counterparty Credit Risk) calculator endpoints.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.saccr import SACCRInput, SACCRResult
from app.services.saccr import SACCRService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/calculate", response_model=SACCRResult)
async def calculate_saccr(
    *,
    input_data: SACCRInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> Any:
    """
    Calculate SACCR (Standardized Approach for Counterparty Credit Risk).
    
    Args:
        input_data: SACCR input data.
        db: Database session.
        current_user: Current authenticated user.
        
    Returns:
        SACCR calculation result.
    """
    try:
        logger.info(f"User {current_user.id} requested SACCR calculation")
        result = SACCRService.calculate_saccr(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in SACCR calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in SACCR calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during SACCR calculation")


@router.post("/calculate-public", response_model=SACCRResult)
async def calculate_saccr_public(
    *,
    input_data: SACCRInput,
    db: Session = Depends(get_db),
) -> Any:
    """
    Calculate SACCR (Standardized Approach for Counterparty Credit Risk) without authentication.
    
    Args:
        input_data: SACCR input data.
        db: Database session.
        
    Returns:
        SACCR calculation result.
    """
    try:
        logger.info("Public request for SACCR calculation")
        result = SACCRService.calculate_saccr(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in SACCR calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in SACCR calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during SACCR calculation")
