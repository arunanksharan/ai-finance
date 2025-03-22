"""
Market data models for the database.
"""
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base


class AssetClass(str, enum.Enum):
    """Asset class enumeration."""
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    DERIVATIVE = "derivative"
    CURRENCY = "currency"
    COMMODITY = "commodity"


class Asset(Base):
    """
    Asset model representing a financial instrument.
    
    Attributes:
        id: Primary key.
        symbol: Ticker symbol or identifier.
        name: Full name of the asset.
        asset_class: Type of asset (equity, fixed income, etc.).
        description: Brief description of the asset.
        created_at: Timestamp when the asset was created.
        updated_at: Timestamp when the asset was last updated.
        market_data: Relationship to market data points.
    """
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, unique=True)
    name = Column(String)
    asset_class = Column(Enum(AssetClass))
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    market_data = relationship("MarketData", back_populates="asset")


class MarketData(Base):
    """
    Market data model for storing price and volume information.
    
    Attributes:
        id: Primary key.
        asset_id: Foreign key to the asset.
        timestamp: Time when the data was recorded.
        open_price: Opening price.
        high_price: Highest price during the period.
        low_price: Lowest price during the period.
        close_price: Closing price.
        volume: Trading volume.
        source: Data source (e.g., Alpha Vantage, Finnhub).
        created_at: Timestamp when the record was created.
        asset: Relationship to the asset.
    """
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    timestamp = Column(DateTime, index=True)
    open_price = Column(Float, nullable=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)
    close_price = Column(Float)
    volume = Column(Float, nullable=True)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    asset = relationship("Asset", back_populates="market_data")


class EconomicIndicator(Base):
    """
    Economic indicator model for storing macroeconomic data.
    
    Attributes:
        id: Primary key.
        name: Name of the indicator (e.g., GDP, CPI).
        value: Value of the indicator.
        region: Geographic region (e.g., US, EU).
        timestamp: Time when the data was recorded.
        source: Data source.
        created_at: Timestamp when the record was created.
    """
    __tablename__ = "economic_indicators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    value = Column(Float)
    region = Column(String, index=True)
    timestamp = Column(DateTime, index=True)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class MarketMetric(Base):
    """
    Market metric model for storing calculated metrics.
    
    Attributes:
        id: Primary key.
        asset_id: Foreign key to the asset (optional).
        name: Name of the metric (e.g., bid-ask spread, volatility).
        value: Value of the metric.
        timestamp: Time when the metric was calculated.
        created_at: Timestamp when the record was created.
        asset: Relationship to the asset.
    """
    __tablename__ = "market_metrics"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    name = Column(String, index=True)
    value = Column(Float)
    timestamp = Column(DateTime, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    asset = relationship("Asset")
