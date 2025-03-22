"""
Finance Calculator endpoints.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.finance_calculator import FinanceCalculatorInput, FinanceCalculatorResult
from app.services.finance_calculator import FinanceCalculatorService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/calculate", response_model=FinanceCalculatorResult)
async def calculate(
    *,
    input_data: FinanceCalculatorInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> Any:
    """
    Perform financial calculation.
    
    Args:
        input_data: Financial calculation input data.
        db: Database session.
        current_user: Current authenticated user.
        
    Returns:
        Financial calculation result.
    """
    try:
        logger.info(
            f"User {current_user.id} requested {input_data.calculation_type} calculation"
        )
        result = FinanceCalculatorService.calculate(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in finance calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in finance calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during calculation")


@router.post("/calculate-public", response_model=FinanceCalculatorResult)
async def calculate_public(
    *,
    input_data: FinanceCalculatorInput,
    db: Session = Depends(get_db),
) -> Any:
    """
    Perform financial calculation without authentication.
    
    Args:
        input_data: Financial calculation input data.
        db: Database session.
        
    Returns:
        Financial calculation result.
    """
    try:
        logger.info(f"Public request for {input_data.calculation_type} calculation")
        result = FinanceCalculatorService.calculate(input_data)
        return result
    except ValueError as e:
        logger.error(f"Validation error in finance calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in finance calculation: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred during calculation")
