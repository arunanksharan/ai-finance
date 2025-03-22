"""
Schemas for the Potential Future Exposure (PFE) calculator.
"""
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class AssetClass(str, Enum):
    """
    Asset classes for PFE calculations.
    """
    INTEREST_RATE = "interest_rate"
    CREDIT = "credit"
    EQUITY = "equity"
    COMMODITY = "commodity"
    FX = "fx"


class TransactionType(str, Enum):
    """
    Transaction types for PFE calculations.
    """
    SWAP = "swap"
    FORWARD = "forward"
    OPTION = "option"
    SWAPTION = "swaption"
    FUTURES = "futures"
    OTHER = "other"


class CalculationMethod(str, Enum):
    """
    Calculation methods for PFE.
    """
    SA_CCR = "sa_ccr"
    INTERNAL_MODEL = "internal_model"
    HISTORICAL = "historical"


class TimeHorizon(str, Enum):
    """
    Time horizons for PFE calculation.
    """
    ONE_WEEK = "1w"
    ONE_MONTH = "1m"
    THREE_MONTH = "3m"
    SIX_MONTH = "6m"
    ONE_YEAR = "1y"
    TWO_YEAR = "2y"
    FIVE_YEAR = "5y"


class ConfidenceLevel(str, Enum):
    """
    Confidence levels for PFE calculation.
    """
    CL_95 = "95%"
    CL_97_5 = "97.5%"
    CL_99 = "99%"


class Trade(BaseModel):
    """
    Trade schema for PFE calculations.
    
    Attributes:
        id: Unique identifier for the trade.
        asset_class: Asset class of the trade.
        transaction_type: Type of transaction.
        notional: Notional amount of the trade.
        maturity: Maturity of the trade in years.
        market_value: Current market value of the trade.
        supervisory_delta: Supervisory delta adjustment (if provided).
        supervisory_factor: Supervisory factor (if provided).
        maturity_factor: Maturity factor (if provided).
    """
    id: str
    asset_class: AssetClass
    transaction_type: TransactionType
    notional: float = Field(..., gt=0)
    maturity: float = Field(..., gt=0)
    market_value: float
    supervisory_delta: Optional[float] = None
    supervisory_factor: Optional[float] = None
    maturity_factor: Optional[float] = None
    
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


class Collateral(BaseModel):
    """
    Collateral schema for PFE calculations.
    
    Attributes:
        id: Unique identifier for the collateral.
        amount: Collateral amount.
        currency: Collateral currency.
        haircut: Haircut applied to the collateral.
    """
    id: str
    amount: float = Field(..., ge=0)
    currency: str
    haircut: float = Field(0.0, ge=0, le=1.0)


class NettingSet(BaseModel):
    """
    Netting set schema for PFE calculations.
    
    Attributes:
        id: Unique identifier for the netting set.
        trades: List of trades in the netting set.
        collateral: List of collateral in the netting set.
    """
    id: str
    trades: List[Trade]
    collateral: List[Collateral] = Field(default_factory=list)


class PFEInput(BaseModel):
    """
    Input schema for PFE calculations.
    
    Attributes:
        netting_sets: List of netting sets.
        calculation_method: Method for PFE calculation.
        time_horizon: Time horizon for PFE calculation.
        confidence_level: Confidence level for PFE calculation.
    """
    netting_sets: List[NettingSet]
    calculation_method: CalculationMethod = Field(CalculationMethod.SA_CCR)
    time_horizon: TimeHorizon = Field(TimeHorizon.ONE_YEAR)
    confidence_level: ConfidenceLevel = Field(ConfidenceLevel.CL_97_5)


class ExposureProfile(BaseModel):
    """
    Exposure profile schema for PFE results.
    
    Attributes:
        time_point: Time point in the exposure profile.
        expected_exposure: Expected exposure at the time point.
        potential_future_exposure: Potential future exposure at the time point.
    """
    time_point: str
    expected_exposure: float
    potential_future_exposure: float


class AssetClassBreakdown(BaseModel):
    """
    Asset class breakdown schema for PFE results.
    
    Attributes:
        asset_class: Asset class.
        exposure: Exposure for the asset class.
        percentage: Percentage of total exposure.
    """
    asset_class: AssetClass
    exposure: float
    percentage: float


class PFEResult(BaseModel):
    """
    Result schema for PFE calculations.
    
    Attributes:
        total_pfe: Total potential future exposure.
        total_expected_exposure: Total expected exposure.
        calculation_method: Method used for PFE calculation.
        time_horizon: Time horizon used for PFE calculation.
        confidence_level: Confidence level used for PFE calculation.
        exposure_profile: Exposure profile over time.
        asset_class_breakdown: Breakdown of exposure by asset class.
        netting_set_results: Results per netting set.
    """
    total_pfe: float
    total_expected_exposure: float
    calculation_method: CalculationMethod
    time_horizon: TimeHorizon
    confidence_level: ConfidenceLevel
    exposure_profile: List[ExposureProfile]
    asset_class_breakdown: List[AssetClassBreakdown]
    netting_set_results: Dict[str, Dict[str, Union[float, Dict]]]
