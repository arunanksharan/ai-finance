"""
Finance Calculator service.
"""
import logging
import math
from typing import Dict, Optional, Tuple

from app.schemas.finance_calculator import (
    CalculationType,
    CompoundingFrequency,
    FinanceCalculatorInput,
    FinanceCalculatorResult,
)

logger = logging.getLogger(__name__)


class FinanceCalculatorService:
    """
    Service for financial calculations.
    """
    
    @staticmethod
    def _get_compounding_factor(frequency: CompoundingFrequency) -> int:
        """
        Get the compounding factor for a given frequency.
        
        Args:
            frequency: Compounding frequency.
            
        Returns:
            Compounding factor.
        """
        compounding_factors = {
            CompoundingFrequency.ANNUALLY: 1,
            CompoundingFrequency.SEMI_ANNUALLY: 2,
            CompoundingFrequency.QUARTERLY: 4,
            CompoundingFrequency.MONTHLY: 12,
            CompoundingFrequency.DAILY: 365,
        }
        return compounding_factors.get(frequency, 1)
    
    @staticmethod
    def calculate_future_value(
        principal: float,
        interest_rate: float,
        time_period: float,
        compounding_frequency: CompoundingFrequency,
    ) -> Tuple[float, str]:
        """
        Calculate future value.
        
        Args:
            principal: Principal amount.
            interest_rate: Annual interest rate as a decimal.
            time_period: Time period in years.
            compounding_frequency: Frequency of compounding.
            
        Returns:
            Tuple of future value and explanation.
        """
        if compounding_frequency == CompoundingFrequency.CONTINUOUS:
            future_value = principal * math.exp(interest_rate * time_period)
            explanation = (
                f"Future Value = {principal:.2f} × e^({interest_rate:.4f} × {time_period:.2f}) = {future_value:.2f}\n\n"
                f"Using continuous compounding, the future value of {principal:.2f} "
                f"at an annual interest rate of {interest_rate * 100:.2f}% "
                f"over {time_period:.2f} years is {future_value:.2f}."
            )
        else:
            n = FinanceCalculatorService._get_compounding_factor(compounding_frequency)
            future_value = principal * (1 + interest_rate / n) ** (n * time_period)
            explanation = (
                f"Future Value = {principal:.2f} × (1 + {interest_rate:.4f}/{n})^({n} × {time_period:.2f}) = {future_value:.2f}\n\n"
                f"With {compounding_frequency.value} compounding, the future value of {principal:.2f} "
                f"at an annual interest rate of {interest_rate * 100:.2f}% "
                f"over {time_period:.2f} years is {future_value:.2f}."
            )
        
        return future_value, explanation
    
    @staticmethod
    def calculate_present_value(
        future_value: float,
        interest_rate: float,
        time_period: float,
        compounding_frequency: CompoundingFrequency,
    ) -> Tuple[float, str]:
        """
        Calculate present value.
        
        Args:
            future_value: Future value.
            interest_rate: Annual interest rate as a decimal.
            time_period: Time period in years.
            compounding_frequency: Frequency of compounding.
            
        Returns:
            Tuple of present value and explanation.
        """
        if compounding_frequency == CompoundingFrequency.CONTINUOUS:
            present_value = future_value / math.exp(interest_rate * time_period)
            explanation = (
                f"Present Value = {future_value:.2f} / e^({interest_rate:.4f} × {time_period:.2f}) = {present_value:.2f}\n\n"
                f"Using continuous compounding, the present value of {future_value:.2f} "
                f"at an annual interest rate of {interest_rate * 100:.2f}% "
                f"over {time_period:.2f} years is {present_value:.2f}."
            )
        else:
            n = FinanceCalculatorService._get_compounding_factor(compounding_frequency)
            present_value = future_value / ((1 + interest_rate / n) ** (n * time_period))
            explanation = (
                f"Present Value = {future_value:.2f} / (1 + {interest_rate:.4f}/{n})^({n} × {time_period:.2f}) = {present_value:.2f}\n\n"
                f"With {compounding_frequency.value} compounding, the present value of {future_value:.2f} "
                f"at an annual interest rate of {interest_rate * 100:.2f}% "
                f"over {time_period:.2f} years is {present_value:.2f}."
            )
        
        return present_value, explanation
    
    @staticmethod
    def calculate_interest_rate(
        present_value: float,
        future_value: float,
        time_period: float,
        compounding_frequency: CompoundingFrequency,
    ) -> Tuple[float, str]:
        """
        Calculate interest rate.
        
        Args:
            present_value: Present value.
            future_value: Future value.
            time_period: Time period in years.
            compounding_frequency: Frequency of compounding.
            
        Returns:
            Tuple of interest rate and explanation.
        """
        if compounding_frequency == CompoundingFrequency.CONTINUOUS:
            interest_rate = math.log(future_value / present_value) / time_period
            explanation = (
                f"Interest Rate = ln({future_value:.2f} / {present_value:.2f}) / {time_period:.2f} = {interest_rate:.4f}\n\n"
                f"Using continuous compounding, the annual interest rate required to grow {present_value:.2f} "
                f"to {future_value:.2f} over {time_period:.2f} years is {interest_rate * 100:.2f}%."
            )
        else:
            n = FinanceCalculatorService._get_compounding_factor(compounding_frequency)
            interest_rate = n * ((future_value / present_value) ** (1 / (n * time_period)) - 1)
            explanation = (
                f"Interest Rate = {n} × ((({future_value:.2f} / {present_value:.2f})^(1 / ({n} × {time_period:.2f}))) - 1) = {interest_rate:.4f}\n\n"
                f"With {compounding_frequency.value} compounding, the annual interest rate required to grow {present_value:.2f} "
                f"to {future_value:.2f} over {time_period:.2f} years is {interest_rate * 100:.2f}%."
            )
        
        return interest_rate, explanation
    
    @staticmethod
    def calculate_time_period(
        present_value: float,
        future_value: float,
        interest_rate: float,
        compounding_frequency: CompoundingFrequency,
    ) -> Tuple[float, str]:
        """
        Calculate time period.
        
        Args:
            present_value: Present value.
            future_value: Future value.
            interest_rate: Annual interest rate as a decimal.
            compounding_frequency: Frequency of compounding.
            
        Returns:
            Tuple of time period and explanation.
        """
        if compounding_frequency == CompoundingFrequency.CONTINUOUS:
            time_period = math.log(future_value / present_value) / interest_rate
            explanation = (
                f"Time Period = ln({future_value:.2f} / {present_value:.2f}) / {interest_rate:.4f} = {time_period:.2f}\n\n"
                f"Using continuous compounding, it will take {time_period:.2f} years for {present_value:.2f} "
                f"to grow to {future_value:.2f} at an annual interest rate of {interest_rate * 100:.2f}%."
            )
        else:
            n = FinanceCalculatorService._get_compounding_factor(compounding_frequency)
            time_period = math.log(future_value / present_value) / (n * math.log(1 + interest_rate / n))
            explanation = (
                f"Time Period = ln({future_value:.2f} / {present_value:.2f}) / ({n} × ln(1 + {interest_rate:.4f}/{n})) = {time_period:.2f}\n\n"
                f"With {compounding_frequency.value} compounding, it will take {time_period:.2f} years for {present_value:.2f} "
                f"to grow to {future_value:.2f} at an annual interest rate of {interest_rate * 100:.2f}%."
            )
        
        return time_period, explanation
    
    @classmethod
    def calculate(cls, input_data: FinanceCalculatorInput) -> FinanceCalculatorResult:
        """
        Perform financial calculation based on input data.
        
        Args:
            input_data: Financial calculation input data.
            
        Returns:
            Financial calculation result.
            
        Raises:
            ValueError: If required parameters are missing.
        """
        try:
            calculation_type = input_data.calculation_type
            compounding_frequency = input_data.compounding_frequency
            
            if calculation_type == CalculationType.FUTURE_VALUE:
                if not all([input_data.principal, input_data.interest_rate, input_data.time_period]):
                    raise ValueError("Principal, interest rate, and time period are required for future value calculation")
                
                result, explanation = cls.calculate_future_value(
                    principal=input_data.principal,
                    interest_rate=input_data.interest_rate,
                    time_period=input_data.time_period,
                    compounding_frequency=compounding_frequency,
                )
            
            elif calculation_type == CalculationType.PRESENT_VALUE:
                if not all([input_data.future_value, input_data.interest_rate, input_data.time_period]):
                    raise ValueError("Future value, interest rate, and time period are required for present value calculation")
                
                result, explanation = cls.calculate_present_value(
                    future_value=input_data.future_value,
                    interest_rate=input_data.interest_rate,
                    time_period=input_data.time_period,
                    compounding_frequency=compounding_frequency,
                )
            
            elif calculation_type == CalculationType.INTEREST_RATE:
                if not all([input_data.present_value, input_data.future_value, input_data.time_period]):
                    raise ValueError("Present value, future value, and time period are required for interest rate calculation")
                
                result, explanation = cls.calculate_interest_rate(
                    present_value=input_data.present_value,
                    future_value=input_data.future_value,
                    time_period=input_data.time_period,
                    compounding_frequency=compounding_frequency,
                )
            
            elif calculation_type == CalculationType.TIME_PERIOD:
                if not all([input_data.present_value, input_data.future_value, input_data.interest_rate]):
                    raise ValueError("Present value, future value, and interest rate are required for time period calculation")
                
                result, explanation = cls.calculate_time_period(
                    present_value=input_data.present_value,
                    future_value=input_data.future_value,
                    interest_rate=input_data.interest_rate,
                    compounding_frequency=compounding_frequency,
                )
            
            else:
                raise ValueError(f"Unsupported calculation type: {calculation_type}")
            
            return FinanceCalculatorResult(
                calculation_type=calculation_type,
                result=result,
                explanation=explanation,
            )
        
        except Exception as e:
            logger.error(f"Error in finance calculation: {str(e)}")
            raise
