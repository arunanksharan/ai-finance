"""
Schemas for the Initial Margin (IM) calculator.
"""
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class AssetClass(str, Enum):
    """
    Asset classes for Initial Margin calculations.
    """
    INTEREST_RATE = "interest_rate"
    CREDIT = "credit"
    EQUITY = "equity"
    COMMODITY = "commodity"
    FX = "fx"


class CalculationMethod(str, Enum):
    """
    Calculation methods for Initial Margin.
    """
    GRID = "grid"  # Schedule/Grid Approach (BCBS-IOSCO)
    SIMM = "simm"  # ISDA SIMM (Model-Based Approach)


class Product(str, Enum):
    """
    Product types for Initial Margin calculations.
    """
    SWAP = "swap"
    FORWARD = "forward"
    OPTION = "option"
    SWAPTION = "swaption"
    FUTURES = "futures"
    OTHER = "other"


class Trade(BaseModel):
    """
    Trade schema for Initial Margin calculations.
    
    Attributes:
        id: Unique identifier for the trade.
        asset_class: Asset class of the trade.
        product: Product type.
        notional: Notional amount of the trade.
        maturity: Maturity of the trade in years.
        market_value: Current market value of the trade.
        delta: Delta sensitivity of the trade.
        vega: Vega sensitivity of the trade (for options).
        curvature: Curvature sensitivity of the trade (for options).
    """
    id: str
    asset_class: AssetClass
    product: Product
    notional: float = Field(..., gt=0)
    maturity: float = Field(..., gt=0)
    market_value: float
    delta: Optional[float] = None
    vega: Optional[float] = None
    curvature: Optional[float] = None
    
    @validator("notional", "maturity", pre=True)
    def validate_positive(cls, v, values, **kwargs):
        """
        Validate that values are positive.
        
        Args:
            v: Value to validate.
            values: Previously validated values.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is not positive.
        """
        if v <= 0:
            raise ValueError("Value must be positive")
        return v


class NettingSet(BaseModel):
    """
    Netting set schema for Initial Margin calculations.
    
    Attributes:
        id: Unique identifier for the netting set.
        trades: List of trades in the netting set.
    """
    id: str
    trades: List[Trade]


class InitialMarginInput(BaseModel):
    """
    Input schema for Initial Margin calculations.
    
    Attributes:
        netting_sets: List of netting sets.
        calculation_method: Method for Initial Margin calculation.
    """
    netting_sets: List[NettingSet]
    calculation_method: CalculationMethod = Field(CalculationMethod.GRID)


class AssetClassBreakdown(BaseModel):
    """
    Asset class breakdown schema for Initial Margin results.
    
    Attributes:
        asset_class: Asset class.
        margin: Margin for the asset class.
        percentage: Percentage of total margin.
    """
    asset_class: AssetClass
    margin: float
    percentage: float


class SensitivityBreakdown(BaseModel):
    """
    Sensitivity breakdown schema for Initial Margin results (SIMM only).
    
    Attributes:
        delta: Delta component of the margin.
        vega: Vega component of the margin.
        curvature: Curvature component of the margin.
    """
    delta: float
    vega: float
    curvature: float


class InitialMarginResult(BaseModel):
    """
    Result schema for Initial Margin calculations.
    
    Attributes:
        total_margin: Total initial margin.
        calculation_method: Method used for Initial Margin calculation.
        asset_class_breakdown: Breakdown of margin by asset class.
        sensitivity_breakdown: Breakdown of margin by sensitivity (SIMM only).
        netting_set_results: Results per netting set.
    """
    total_margin: float
    calculation_method: CalculationMethod
    asset_class_breakdown: List[AssetClassBreakdown]
    sensitivity_breakdown: Optional[SensitivityBreakdown] = None
    netting_set_results: Dict[str, Dict[str, Union[float, Dict]]]
