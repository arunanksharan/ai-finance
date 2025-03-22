"""
API endpoints for market data.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.market_data import AssetClass
from app.schemas.market_data import (
    Asset, AssetCreate, AssetList,
    MarketData, MarketDataCreate, MarketDataList,
    EconomicIndicator, EconomicIndicatorCreate, EconomicIndicatorList,
    MarketMetric, MarketMetricCreate, MarketMetricList,
    MarketDataFilter, MarketDataTimeSeries, DashboardSummary, AssetWithLatestData
)
from app.services.market_data import MarketDataService


router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: Session = Depends(get_db),
    asset_class: Optional[AssetClass] = None
):
    """
    Get dashboard summary with latest data.
    
    Args:
        db: Database session.
        asset_class: Optional filter by asset class.
        
    Returns:
        Dashboard summary.
    """
    # Get assets by class
    assets_by_class = {}
    for asset_class_value in AssetClass:
        assets, count = MarketDataService.get_assets(
            db, asset_class=asset_class_value, limit=5
        )
        assets_by_class[asset_class_value] = {
            "count": count,
            "sample": [Asset.model_validate(asset) for asset in assets[:5]]
        }
    
    # Get latest economic indicators
    indicators, _ = MarketDataService.get_economic_indicators(db, limit=5)
    
    # Get trending assets (those with recent data)
    trending_assets = []
    assets, _ = MarketDataService.get_assets(db, limit=10, asset_class=asset_class)
    
    for asset in assets:
        # Get latest market data
        market_data, _ = MarketDataService.get_market_data(
            db,
            MarketDataFilter(
                symbols=[asset.symbol],
                limit=1
            )
        )
        
        # Get metrics
        metrics, _ = MarketDataService.get_market_metrics(
            db,
            asset_id=asset.id,
            limit=5
        )
        
        trending_assets.append(
            AssetWithLatestData(
                asset=Asset.model_validate(asset),
                latest_data=MarketData.model_validate(market_data[0]) if market_data else None,
                metrics=[MarketMetric.model_validate(metric) for metric in metrics]
            )
        )
    
    return DashboardSummary(
        assets_by_class=assets_by_class,
        latest_economic_indicators=[
            EconomicIndicator.model_validate(indicator) for indicator in indicators
        ],
        trending_assets=trending_assets
    )


@router.get("/assets", response_model=AssetList)
async def get_assets(
    skip: int = 0,
    limit: int = 100,
    asset_class: Optional[AssetClass] = None,
    db: Session = Depends(get_db)
):
    """
    Get assets with optional filtering.
    
    Args:
        skip: Number of records to skip.
        limit: Maximum number of records to return.
        asset_class: Filter by asset class.
        db: Database session.
        
    Returns:
        List of assets.
    """
    assets, total = MarketDataService.get_assets(
        db, skip=skip, limit=limit, asset_class=asset_class
    )
    
    return AssetList(
        items=[Asset.model_validate(asset) for asset in assets],
        total=total
    )


@router.post("/assets", response_model=Asset)
async def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new asset.
    
    Args:
        asset: Asset data.
        db: Database session.
        
    Returns:
        Created asset.
    """
    # Check if asset already exists
    existing_asset = MarketDataService.get_asset_by_symbol(db, asset.symbol)
    if existing_asset:
        raise HTTPException(
            status_code=400,
            detail=f"Asset with symbol {asset.symbol} already exists"
        )
    
    db_asset = MarketDataService.create_asset(db, asset)
    return Asset.model_validate(db_asset)


@router.get("/market-data", response_model=MarketDataList)
async def get_market_data(
    symbols: Optional[List[str]] = Query(None),
    asset_class: Optional[AssetClass] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get market data with filtering.
    
    Args:
        symbols: Filter by asset symbols.
        asset_class: Filter by asset class.
        start_date: Filter by start date.
        end_date: Filter by end date.
        limit: Maximum number of records to return.
        offset: Number of records to skip.
        db: Database session.
        
    Returns:
        List of market data points.
    """
    filter_params = MarketDataFilter(
        symbols=symbols,
        asset_class=asset_class,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    market_data, total = MarketDataService.get_market_data(db, filter_params)
    
    return MarketDataList(
        items=[MarketData.model_validate(data) for data in market_data],
        total=total
    )


@router.get("/market-data/time-series/{asset_id}", response_model=MarketDataTimeSeries)
async def get_time_series(
    asset_id: int,
    metric: str = "close_price",
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Get time series data for an asset.
    
    Args:
        asset_id: Asset ID.
        metric: Metric to retrieve (e.g., close_price).
        start_date: Start date for filtering.
        end_date: End date for filtering.
        db: Database session.
        
    Returns:
        Time series data.
    """
    try:
        return MarketDataService.get_time_series_data(
            db, asset_id, metric, start_date, end_date
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/economic-indicators", response_model=EconomicIndicatorList)
async def get_economic_indicators(
    skip: int = 0,
    limit: int = 100,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get economic indicators with optional filtering.
    
    Args:
        skip: Number of records to skip.
        limit: Maximum number of records to return.
        region: Filter by region.
        db: Database session.
        
    Returns:
        List of economic indicators.
    """
    indicators, total = MarketDataService.get_economic_indicators(
        db, skip=skip, limit=limit, region=region
    )
    
    return EconomicIndicatorList(
        items=[EconomicIndicator.model_validate(indicator) for indicator in indicators],
        total=total
    )


@router.post("/economic-indicators", response_model=EconomicIndicator)
async def create_economic_indicator(
    indicator: EconomicIndicatorCreate,
    db: Session = Depends(get_db)
):
    """
    Create economic indicator entry.
    
    Args:
        indicator: Economic indicator data.
        db: Database session.
        
    Returns:
        Created economic indicator.
    """
    db_indicator = MarketDataService.create_economic_indicator(db, indicator)
    return EconomicIndicator.model_validate(db_indicator)


@router.get("/market-metrics", response_model=MarketMetricList)
async def get_market_metrics(
    skip: int = 0,
    limit: int = 100,
    asset_id: Optional[int] = None,
    metric_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get market metrics with optional filtering.
    
    Args:
        skip: Number of records to skip.
        limit: Maximum number of records to return.
        asset_id: Filter by asset ID.
        metric_name: Filter by metric name.
        db: Database session.
        
    Returns:
        List of market metrics.
    """
    metrics, total = MarketDataService.get_market_metrics(
        db, skip=skip, limit=limit, asset_id=asset_id, metric_name=metric_name
    )
    
    return MarketMetricList(
        items=[MarketMetric.model_validate(metric) for metric in metrics],
        total=total
    )


@router.post("/market-metrics", response_model=MarketMetric)
async def create_market_metric(
    metric: MarketMetricCreate,
    db: Session = Depends(get_db)
):
    """
    Create market metric entry.
    
    Args:
        metric: Market metric data.
        db: Database session.
        
    Returns:
        Created market metric.
    """
    db_metric = MarketDataService.create_market_metric(db, metric)
    return MarketMetric.model_validate(db_metric)


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_market_data(
    symbols: List[str],
    asset_class: AssetClass,
    data_source: str = "alpha_vantage",
    db: Session = Depends(get_db)
):
    """
    Refresh market data for multiple symbols.
    
    Args:
        symbols: List of asset symbols.
        asset_class: Asset class.
        data_source: Data source to use.
        db: Database session.
        
    Returns:
        Dictionary with symbols and count of entries created.
    """
    results = await MarketDataService.refresh_market_data(
        db, symbols, asset_class, data_source
    )
    
    # Calculate metrics for each asset
    for symbol in symbols:
        asset = MarketDataService.get_asset_by_symbol(db, symbol)
        if asset:
            MarketDataService.calculate_market_metrics(db, asset.id)
    
    return {
        "status": "success",
        "data_source": data_source,
        "asset_class": asset_class,
        "results": results
    }


@router.post("/calculate-metrics/{asset_id}", response_model=List[MarketMetric])
async def calculate_metrics(
    asset_id: int,
    db: Session = Depends(get_db)
):
    """
    Calculate and store market metrics for an asset.
    
    Args:
        asset_id: Asset ID.
        db: Database session.
        
    Returns:
        List of created market metrics.
    """
    metrics = MarketDataService.calculate_market_metrics(db, asset_id)
    return [MarketMetric.model_validate(metric) for metric in metrics]
