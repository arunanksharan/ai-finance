"""
Pydantic schemas for market data.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.market_data import AssetClass


# Base schemas
class AssetBase(BaseModel):
    """Base schema for an asset."""
    symbol: str
    name: str
    asset_class: AssetClass
    description: Optional[str] = None


class MarketDataBase(BaseModel):
    """Base schema for market data."""
    timestamp: datetime
    open_price: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    close_price: float
    volume: Optional[float] = None
    source: str


class EconomicIndicatorBase(BaseModel):
    """Base schema for economic indicators."""
    name: str
    value: float
    region: str
    timestamp: datetime
    source: str


class MarketMetricBase(BaseModel):
    """Base schema for market metrics."""
    name: str
    value: float
    timestamp: datetime


# Create schemas
class AssetCreate(AssetBase):
    """Schema for creating an asset."""
    pass


class MarketDataCreate(MarketDataBase):
    """Schema for creating market data."""
    asset_id: int


class EconomicIndicatorCreate(EconomicIndicatorBase):
    """Schema for creating an economic indicator."""
    pass


class MarketMetricCreate(MarketMetricBase):
    """Schema for creating a market metric."""
    asset_id: Optional[int] = None


# Response schemas
class Asset(AssetBase):
    """Schema for asset response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class MarketData(MarketDataBase):
    """Schema for market data response."""
    id: int
    asset_id: int
    created_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class EconomicIndicator(EconomicIndicatorBase):
    """Schema for economic indicator response."""
    id: int
    created_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class MarketMetric(MarketMetricBase):
    """Schema for market metric response."""
    id: int
    asset_id: Optional[int] = None
    created_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


# List response schemas
class AssetList(BaseModel):
    """Schema for list of assets."""
    items: List[Asset]
    total: int


class MarketDataList(BaseModel):
    """Schema for list of market data points."""
    items: List[MarketData]
    total: int


class EconomicIndicatorList(BaseModel):
    """Schema for list of economic indicators."""
    items: List[EconomicIndicator]
    total: int


class MarketMetricList(BaseModel):
    """Schema for list of market metrics."""
    items: List[MarketMetric]
    total: int


# Dashboard specific schemas
class AssetWithLatestData(BaseModel):
    """Schema for asset with latest market data."""
    asset: Asset
    latest_data: Optional[MarketData] = None
    metrics: List[MarketMetric] = []

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class MarketDataTimeSeriesPoint(BaseModel):
    """Schema for a single point in a time series."""
    timestamp: datetime
    value: float


class MarketDataTimeSeries(BaseModel):
    """Schema for market data time series."""
    asset_id: int
    asset_symbol: str
    asset_name: str
    metric: str
    data: List[MarketDataTimeSeriesPoint]


class DashboardSummary(BaseModel):
    """Schema for dashboard summary."""
    assets_by_class: dict
    latest_economic_indicators: List[EconomicIndicator]
    trending_assets: List[AssetWithLatestData]


class MarketDataFilter(BaseModel):
    """Schema for filtering market data."""
    asset_class: Optional[AssetClass] = None
    symbols: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    metrics: Optional[List[str]] = None
    limit: int = 100
    offset: int = 0
