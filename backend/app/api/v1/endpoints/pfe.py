"""
Potential Future Exposure (PFE) calculator endpoints.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.pfe import PFEInput, PFEResult
from app.services.pfe import PFEService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/calculate", response_model=PFEResult)
async def calculate_pfe(
    *,
    input_data: PFEInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> Any:
    """
    Calculate Potential Future Exposure (PFE).
    
    Args:
        input_data: PFE input data.
        db: Database session.
        current_user: Current authenticated user.
        
    Returns:
        PFE calculation result.
    """
    try:
        logger.info(f"User {current_user.id} requested PFE calculation using {input_data.calculation_method} method")
        result = PFEService.calculate_pfe(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in PFE calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in PFE calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during PFE calculation")


@router.post("/calculate-public", response_model=PFEResult)
async def calculate_pfe_public(
    *,
    input_data: PFEInput,
    db: Session = Depends(get_db),
) -> Any:
    """
    Calculate Potential Future Exposure (PFE) without authentication.
    
    Args:
        input_data: PFE input data.
        db: Database session.
        
    Returns:
        PFE calculation result.
    """
    try:
        logger.info(f"Public request for PFE calculation using {input_data.calculation_method} method")
        result = PFEService.calculate_pfe(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in PFE calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in PFE calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during PFE calculation")
