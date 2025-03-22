"""
Schemas for the SACCR (Standardized Approach for Counterparty Credit Risk) calculator.
"""
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class AssetClass(str, Enum):
    """
    Asset classes for SACCR calculations.
    """
    INTEREST_RATE = "interest_rate"
    CREDIT = "credit"
    EQUITY = "equity"
    COMMODITY = "commodity"
    FX = "fx"


class TransactionType(str, Enum):
    """
    Transaction types for SACCR calculations.
    """
    SWAP = "swap"
    FORWARD = "forward"
    OPTION = "option"
    SWAPTION = "swaption"
    FUTURES = "futures"
    OTHER = "other"


class OptionType(str, Enum):
    """
    Option types for SACCR calculations.
    """
    CALL = "call"
    PUT = "put"


class OptionStyle(str, Enum):
    """
    Option styles for SACCR calculations.
    """
    EUROPEAN = "european"
    AMERICAN = "american"


class Transaction(BaseModel):
    """
    Transaction schema for SACCR calculations.
    
    Attributes:
        id: Unique identifier for the transaction.
        asset_class: Asset class of the transaction.
        transaction_type: Type of transaction.
        notional: Notional amount of the transaction.
        maturity: Maturity of the transaction in years.
        underlying_price: Current price of the underlying asset.
        strike_price: Strike price for options.
        option_type: Type of option (call or put).
        option_style: Style of option (European or American).
        volatility: Volatility of the underlying asset.
        interest_rate: Risk-free interest rate.
        supervisory_delta: Supervisory delta adjustment (if provided).
        supervisory_factor: Supervisory factor (if provided).
        maturity_factor: Maturity factor (if provided).
    """
    id: str
    asset_class: AssetClass
    transaction_type: TransactionType
    notional: float = Field(..., gt=0)
    maturity: float = Field(..., gt=0)
    underlying_price: Optional[float] = None
    strike_price: Optional[float] = None
    option_type: Optional[OptionType] = None
    option_style: Optional[OptionStyle] = None
    volatility: Optional[float] = None
    interest_rate: Optional[float] = None
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
    
    @validator("option_type", "option_style", pre=True)
    def validate_option_fields(cls, v, values, **kwargs):
        """
        Validate option fields.
        
        Args:
            v: Value to validate.
            values: Previously validated values.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If transaction type is option but option fields are missing.
        """
        if values.get("transaction_type") in [TransactionType.OPTION, TransactionType.SWAPTION] and v is None:
            field_name = kwargs["field"].name
            raise ValueError(f"{field_name} is required for option transactions")
        return v


class NettingSet(BaseModel):
    """
    Netting set schema for SACCR calculations.
    
    Attributes:
        id: Unique identifier for the netting set.
        transactions: List of transactions in the netting set.
        collateral: Collateral amount.
    """
    id: str
    transactions: List[Transaction]
    collateral: float = Field(0, ge=0)


class SACCRInput(BaseModel):
    """
    Input schema for SACCR calculations.
    
    Attributes:
        netting_sets: List of netting sets.
    """
    netting_sets: List[NettingSet]


class AssetClassResult(BaseModel):
    """
    Result schema for SACCR calculations per asset class.
    
    Attributes:
        replacement_cost: Replacement cost component.
        potential_future_exposure: Potential future exposure component.
        ead: Exposure at default.
        details: Additional calculation details.
    """
    replacement_cost: float
    potential_future_exposure: float
    ead: float
    details: Dict[str, Union[float, str, Dict]]


class SACCRResult(BaseModel):
    """
    Result schema for SACCR calculations.
    
    Attributes:
        total_ead: Total exposure at default.
        total_replacement_cost: Total replacement cost component.
        total_potential_future_exposure: Total potential future exposure component.
        asset_class_results: Results per asset class.
        netting_set_results: Results per netting set.
    """
    total_ead: float
    total_replacement_cost: float
    total_potential_future_exposure: float
    asset_class_results: Dict[AssetClass, AssetClassResult]
    netting_set_results: Dict[str, Dict[str, Union[float, Dict]]]
