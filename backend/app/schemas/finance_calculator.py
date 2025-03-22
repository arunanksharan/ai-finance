"""
Schemas for the Finance Calculator.
"""
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, validator


class CompoundingFrequency(str, Enum):
    """
    Compounding frequency options.
    """
    ANNUALLY = "annually"
    SEMI_ANNUALLY = "semi-annually"
    QUARTERLY = "quarterly"
    MONTHLY = "monthly"
    DAILY = "daily"
    CONTINUOUS = "continuous"


class CalculationType(str, Enum):
    """
    Types of calculations for the Finance Calculator.
    """
    FUTURE_VALUE = "future_value"
    PRESENT_VALUE = "present_value"
    INTEREST_RATE = "interest_rate"
    TIME_PERIOD = "time_period"


class FinanceCalculatorInput(BaseModel):
    """
    Input schema for the Finance Calculator.
    
    Attributes:
        calculation_type: Type of calculation to perform.
        principal: Principal amount.
        interest_rate: Annual interest rate (as a decimal, e.g., 0.05 for 5%).
        time_period: Time period in years.
        compounding_frequency: Frequency of compounding.
        future_value: Future value (required for present_value and interest_rate calculations).
        present_value: Present value (required for future_value and interest_rate calculations).
    """
    calculation_type: CalculationType
    principal: Optional[float] = Field(None, ge=0, description="Principal amount")
    interest_rate: Optional[float] = Field(None, ge=0, description="Annual interest rate as a decimal")
    time_period: Optional[float] = Field(None, gt=0, description="Time period in years")
    compounding_frequency: CompoundingFrequency = Field(CompoundingFrequency.ANNUALLY)
    future_value: Optional[float] = Field(None, description="Future value")
    present_value: Optional[float] = Field(None, description="Present value")
    
    @validator("principal", "future_value", "present_value", pre=True)
    def validate_amount(cls, v):
        """
        Validate that amounts are non-negative.
        
        Args:
            v: Value to validate.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is negative.
        """
        if v is not None and v < 0:
            raise ValueError("Amount cannot be negative")
        return v
    
    @validator("interest_rate", pre=True)
    def validate_interest_rate(cls, v):
        """
        Validate that interest rate is non-negative.
        
        Args:
            v: Value to validate.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is negative.
        """
        if v is not None and v < 0:
            raise ValueError("Interest rate cannot be negative")
        return v
    
    @validator("time_period", pre=True)
    def validate_time_period(cls, v):
        """
        Validate that time period is positive.
        
        Args:
            v: Value to validate.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is not positive.
        """
        if v is not None and v <= 0:
            raise ValueError("Time period must be positive")
        return v


class FinanceCalculatorResult(BaseModel):
    """
    Result schema for the Finance Calculator.
    
    Attributes:
        calculation_type: Type of calculation performed.
        result: Result of the calculation.
        explanation: Explanation of the calculation.
    """
    calculation_type: CalculationType
    result: float
    explanation: str
