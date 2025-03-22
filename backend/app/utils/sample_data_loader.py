"""
Utility script to load sample market data for testing.
"""
import asyncio
import logging
from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.market_data import AssetClass, EconomicIndicator
from app.schemas.market_data import AssetCreate, EconomicIndicatorCreate
from app.services.market_data import MarketDataService


logger = logging.getLogger(__name__)


# Sample data
SAMPLE_ASSETS = {
    AssetClass.EQUITY: [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "AMZN", "name": "Amazon.com, Inc."},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "META", "name": "Meta Platforms, Inc."}
    ],
    AssetClass.FIXED_INCOME: [
        {"symbol": "TLT", "name": "iShares 20+ Year Treasury Bond ETF"},
        {"symbol": "IEF", "name": "iShares 7-10 Year Treasury Bond ETF"},
        {"symbol": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF"},
        {"symbol": "LQD", "name": "iShares iBoxx $ Investment Grade Corporate Bond ETF"},
        {"symbol": "HYG", "name": "iShares iBoxx $ High Yield Corporate Bond ETF"}
    ],
    AssetClass.DERIVATIVE: [
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust"},
        {"symbol": "IWM", "name": "iShares Russell 2000 ETF"},
        {"symbol": "EEM", "name": "iShares MSCI Emerging Markets ETF"},
        {"symbol": "VXX", "name": "iPath Series B S&P 500 VIX Short-Term Futures ETN"}
    ],
    AssetClass.CURRENCY: [
        {"symbol": "EURUSD=X", "name": "EUR/USD"},
        {"symbol": "GBPUSD=X", "name": "GBP/USD"},
        {"symbol": "USDJPY=X", "name": "USD/JPY"},
        {"symbol": "USDCAD=X", "name": "USD/CAD"},
        {"symbol": "USDCHF=X", "name": "USD/CHF"}
    ],
    AssetClass.COMMODITY: [
        {"symbol": "GC=F", "name": "Gold Futures"},
        {"symbol": "SI=F", "name": "Silver Futures"},
        {"symbol": "CL=F", "name": "Crude Oil Futures"},
        {"symbol": "NG=F", "name": "Natural Gas Futures"},
        {"symbol": "HG=F", "name": "Copper Futures"}
    ]
}

SAMPLE_ECONOMIC_INDICATORS = [
    {"name": "GDP Growth Rate", "region": "US", "value": 2.1},
    {"name": "Inflation Rate", "region": "US", "value": 3.2},
    {"name": "Unemployment Rate", "region": "US", "value": 3.8},
    {"name": "Interest Rate", "region": "US", "value": 5.25},
    {"name": "Consumer Confidence", "region": "US", "value": 102.5},
    {"name": "GDP Growth Rate", "region": "EU", "value": 1.3},
    {"name": "Inflation Rate", "region": "EU", "value": 2.9},
    {"name": "Unemployment Rate", "region": "EU", "value": 6.5},
    {"name": "Interest Rate", "region": "EU", "value": 3.75},
    {"name": "Consumer Confidence", "region": "EU", "value": 96.2}
]


async def load_sample_assets(db: Session):
    """
    Load sample assets into the database.
    
    Args:
        db: Database session.
    """
    logger.info("Loading sample assets...")
    
    for asset_class, assets in SAMPLE_ASSETS.items():
        for asset_data in assets:
            # Check if asset already exists
            existing_asset = MarketDataService.get_asset_by_symbol(db, asset_data["symbol"])
            if not existing_asset:
                asset_create = AssetCreate(
                    symbol=asset_data["symbol"],
                    name=asset_data["name"],
                    asset_class=asset_class,
                    description=f"Sample data for {asset_data['name']}"
                )
                MarketDataService.create_asset(db, asset_create)
                logger.info(f"Created asset: {asset_data['symbol']}")
            else:
                logger.info(f"Asset already exists: {asset_data['symbol']}")


async def load_sample_economic_indicators(db: Session):
    """
    Load sample economic indicators into the database.
    
    Args:
        db: Database session.
    """
    logger.info("Loading sample economic indicators...")
    
    for indicator_data in SAMPLE_ECONOMIC_INDICATORS:
        # Create with current timestamp
        indicator_create = EconomicIndicatorCreate(
            name=indicator_data["name"],
            region=indicator_data["region"],
            value=indicator_data["value"],
            timestamp=datetime.utcnow(),
            source="Sample Data"
        )
        MarketDataService.create_economic_indicator(db, indicator_create)
        logger.info(f"Created economic indicator: {indicator_data['name']} for {indicator_data['region']}")


async def generate_sample_market_data(db: Session):
    """
    Generate sample market data for assets.
    
    Args:
        db: Database session.
    """
    logger.info("Generating sample market data...")
    
    # Get all assets
    assets, _ = MarketDataService.get_assets(db, limit=1000)
    
    # Generate data for the past 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    current_date = start_date
    
    while current_date <= end_date:
        for asset in assets:
            # Skip weekends
            if current_date.weekday() >= 5:  # 5 is Saturday, 6 is Sunday
                continue
                
            # Generate random price data
            base_price = random.uniform(50, 200)
            volatility = random.uniform(0.01, 0.05)
            
            open_price = base_price * (1 + random.uniform(-volatility, volatility))
            close_price = open_price * (1 + random.uniform(-volatility, volatility))
            high_price = max(open_price, close_price) * (1 + random.uniform(0, volatility))
            low_price = min(open_price, close_price) * (1 - random.uniform(0, volatility))
            volume = random.uniform(100000, 10000000)
            
            # Create market data entry
            market_data_create = MarketDataCreate(
                asset_id=asset.id,
                timestamp=current_date,
                open_price=open_price,
                high_price=high_price,
                low_price=low_price,
                close_price=close_price,
                volume=volume,
                source="Sample Data"
            )
            MarketDataService.create_market_data(db, market_data_create)
            
        # Move to next day
        current_date += timedelta(days=1)
        
    logger.info("Sample market data generation complete")


async def calculate_metrics_for_all_assets(db: Session):
    """
    Calculate metrics for all assets.
    
    Args:
        db: Database session.
    """
    logger.info("Calculating metrics for all assets...")
    
    # Get all assets
    assets, _ = MarketDataService.get_assets(db, limit=1000)
    
    for asset in assets:
        metrics = MarketDataService.calculate_market_metrics(db, asset.id)
        logger.info(f"Calculated {len(metrics)} metrics for asset {asset.symbol}")


async def load_all_sample_data():
    """Load all sample data."""
    db = SessionLocal()
    try:
        await load_sample_assets(db)
        await load_sample_economic_indicators(db)
        await generate_sample_market_data(db)
        await calculate_metrics_for_all_assets(db)
        logger.info("All sample data loaded successfully")
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(load_all_sample_data())
