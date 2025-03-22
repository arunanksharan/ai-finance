"""
Initial Margin (IM) calculator endpoints.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.initial_margin import InitialMarginInput, InitialMarginResult
from app.services.initial_margin import InitialMarginService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/calculate", response_model=InitialMarginResult)
async def calculate_initial_margin(
    *,
    input_data: InitialMarginInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> Any:
    """
    Calculate Initial Margin (IM).
    
    Args:
        input_data: Initial Margin input data.
        db: Database session.
        current_user: Current authenticated user.
        
    Returns:
        Initial Margin calculation result.
    """
    try:
        logger.info(f"User {current_user.id} requested Initial Margin calculation using {input_data.calculation_method} method")
        result = InitialMarginService.calculate_initial_margin(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in Initial Margin calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in Initial Margin calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during Initial Margin calculation")


@router.post("/calculate-public", response_model=InitialMarginResult)
async def calculate_initial_margin_public(
    *,
    input_data: InitialMarginInput,
    db: Session = Depends(get_db),
) -> Any:
    """
    Calculate Initial Margin (IM) without authentication.
    
    Args:
        input_data: Initial Margin input data.
        db: Database session.
        
    Returns:
        Initial Margin calculation result.
    """
    try:
        logger.info(f"Public request for Initial Margin calculation using {input_data.calculation_method} method")
        result = InitialMarginService.calculate_initial_margin(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in Initial Margin calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in Initial Margin calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during Initial Margin calculation")
