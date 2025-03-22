"""
Schemas for the Value at Risk (VaR) calculator.
"""
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class AssetClass(str, Enum):
    """
    Asset classes for VaR calculations.
    """
    EQUITY = "equity"
    FX = "fx"
    INTEREST_RATE = "interest_rate"
    COMMODITY = "commodity"
    CRYPTO = "crypto"


class VaRMethod(str, Enum):
    """
    Methods for VaR calculation.
    """
    HISTORICAL = "historical"
    PARAMETRIC = "parametric"
    MONTE_CARLO = "monte_carlo"


class TimeHorizon(str, Enum):
    """
    Time horizons for VaR calculation.
    """
    ONE_DAY = "1d"
    TEN_DAY = "10d"
    ONE_MONTH = "1m"
    THREE_MONTH = "3m"


class ConfidenceLevel(str, Enum):
    """
    Confidence levels for VaR calculation.
    """
    CL_90 = "90%"
    CL_95 = "95%"
    CL_97_5 = "97.5%"
    CL_99 = "99%"


class Position(BaseModel):
    """
    Position schema for VaR calculations.
    
    Attributes:
        id: Unique identifier for the position.
        asset_class: Asset class of the position.
        ticker: Ticker symbol of the asset.
        quantity: Quantity of the asset.
        price: Current price of the asset.
        volatility: Historical volatility of the asset.
        correlation: Correlation with other assets (optional).
    """
    id: str
    asset_class: AssetClass
    ticker: str
    quantity: float
    price: float
    volatility: Optional[float] = None
    correlation: Optional[Dict[str, float]] = None
    
    @validator("quantity", "price")
    def validate_positive(cls, v):
        """
        Validate that values are positive.
        
        Args:
            v: Value to validate.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is not positive.
        """
        if v <= 0:
            raise ValueError("Value must be positive")
        return v
    
    @validator("volatility")
    def validate_volatility(cls, v):
        """
        Validate that volatility is positive.
        
        Args:
            v: Value to validate.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is not positive.
        """
        if v is not None and v <= 0:
            raise ValueError("Volatility must be positive")
        return v


class Portfolio(BaseModel):
    """
    Portfolio schema for VaR calculations.
    
    Attributes:
        id: Unique identifier for the portfolio.
        positions: List of positions in the portfolio.
    """
    id: str
    positions: List[Position]


class VaRInput(BaseModel):
    """
    Input schema for VaR calculations.
    
    Attributes:
        portfolio: Portfolio data.
        method: VaR calculation method.
        time_horizon: Time horizon for VaR calculation.
        confidence_level: Confidence level for VaR calculation.
        num_simulations: Number of simulations for Monte Carlo method.
        include_stress_scenarios: Whether to include stress scenarios.
    """
    portfolio: Portfolio
    method: VaRMethod = Field(VaRMethod.HISTORICAL)
    time_horizon: TimeHorizon = Field(TimeHorizon.ONE_DAY)
    confidence_level: ConfidenceLevel = Field(ConfidenceLevel.CL_95)
    num_simulations: Optional[int] = Field(10000, gt=0)
    include_stress_scenarios: bool = Field(False)
    
    @validator("num_simulations")
    def validate_num_simulations(cls, v, values):
        """
        Validate number of simulations.
        
        Args:
            v: Value to validate.
            values: Previously validated values.
            
        Returns:
            Validated value.
            
        Raises:
            ValueError: If value is not positive or method is not Monte Carlo.
        """
        if v is not None and values.get("method") == VaRMethod.MONTE_CARLO and v < 1000:
            raise ValueError("Number of simulations must be at least 1000 for Monte Carlo method")
        return v


class AssetContribution(BaseModel):
    """
    Asset contribution schema for VaR results.
    
    Attributes:
        asset_id: Asset identifier.
        ticker: Ticker symbol.
        asset_class: Asset class.
        var_contribution: VaR contribution.
        var_contribution_percentage: VaR contribution as percentage of total VaR.
    """
    asset_id: str
    ticker: str
    asset_class: AssetClass
    var_contribution: float
    var_contribution_percentage: float


class DistributionStatistics(BaseModel):
    """
    Distribution statistics schema for VaR results.
    
    Attributes:
        mean: Mean of the distribution.
        median: Median of the distribution.
        standard_deviation: Standard deviation of the distribution.
        skewness: Skewness of the distribution.
        kurtosis: Kurtosis of the distribution.
        min: Minimum value of the distribution.
        max: Maximum value of the distribution.
    """
    mean: float
    median: float
    standard_deviation: float
    skewness: float
    kurtosis: float
    min: float
    max: float


class StressScenario(BaseModel):
    """
    Stress scenario schema for VaR results.
    
    Attributes:
        name: Name of the stress scenario.
        description: Description of the stress scenario.
        var: VaR under the stress scenario.
        var_increase: Increase in VaR compared to base scenario.
        var_increase_percentage: Percentage increase in VaR compared to base scenario.
    """
    name: str
    description: str
    var: float
    var_increase: float
    var_increase_percentage: float


class VaRResult(BaseModel):
    """
    Result schema for VaR calculations.
    
    Attributes:
        var: Value at Risk.
        var_percentage: Value at Risk as percentage of portfolio value.
        portfolio_value: Total portfolio value.
        method: VaR calculation method used.
        time_horizon: Time horizon used.
        confidence_level: Confidence level used.
        asset_contributions: Contributions of individual assets to VaR.
        diversification_benefit: Diversification benefit.
        diversification_benefit_percentage: Diversification benefit as percentage of undiversified VaR.
        distribution_statistics: Statistics of the return distribution.
        stress_scenarios: Results of stress scenarios.
    """
    var: float
    var_percentage: float
    portfolio_value: float
    method: VaRMethod
    time_horizon: TimeHorizon
    confidence_level: ConfidenceLevel
    asset_contributions: List[AssetContribution]
    diversification_benefit: float
    diversification_benefit_percentage: float
    distribution_statistics: DistributionStatistics
    stress_scenarios: Optional[List[StressScenario]] = None
