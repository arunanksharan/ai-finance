"""
Value at Risk (VaR) calculator endpoints.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.var import VaRInput, VaRResult
from app.services.var import VaRService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/calculate", response_model=VaRResult)
async def calculate_var(
    *,
    input_data: VaRInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> Any:
    """
    Calculate Value at Risk (VaR).
    
    Args:
        input_data: VaR input data.
        db: Database session.
        current_user: Current authenticated user.
        
    Returns:
        VaR calculation result.
    """
    try:
        logger.info(f"User {current_user.id} requested VaR calculation using {input_data.method} method")
        result = VaRService.calculate_var(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in VaR calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in VaR calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during VaR calculation")


@router.post("/calculate-public", response_model=VaRResult)
async def calculate_var_public(
    *,
    input_data: VaRInput,
    db: Session = Depends(get_db),
) -> Any:
    """
    Calculate Value at Risk (VaR) without authentication.
    
    Args:
        input_data: VaR input data.
        db: Database session.
        
    Returns:
        VaR calculation result.
    """
    try:
        logger.info(f"Public request for VaR calculation using {input_data.method} method")
        result = VaRService.calculate_var(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in VaR calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in VaR calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during VaR calculation")
