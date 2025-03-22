"""
Services for fetching and storing market data.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any

import httpx
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.market_data import Asset, AssetClass, MarketData, EconomicIndicator, MarketMetric
from app.schemas.market_data import (
    AssetCreate, MarketDataCreate, EconomicIndicatorCreate, MarketMetricCreate,
    MarketDataFilter, MarketDataTimeSeries, MarketDataTimeSeriesPoint
)


logger = logging.getLogger(__name__)


class MarketDataService:
    """Service for fetching and storing market data."""

    @staticmethod
    async def fetch_alpha_vantage_data(symbol: str, function: str = "TIME_SERIES_DAILY") -> Dict[str, Any]:
        """
        Fetch data from Alpha Vantage API.
        
        Args:
            symbol: Asset symbol.
            function: Alpha Vantage API function.
            
        Returns:
            API response data.
        """
        url = "https://www.alphavantage.co/query"
        params = {
            "function": function,
            "symbol": symbol,
            "apikey": settings.ALPHA_VANTAGE_API_KEY,
            "outputsize": "full"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def fetch_finnhub_data(symbol: str, resolution: str = "D") -> Dict[str, Any]:
        """
        Fetch data from Finnhub API.
        
        Args:
            symbol: Asset symbol.
            resolution: Data resolution (e.g., D for daily).
            
        Returns:
            API response data.
        """
        url = "https://finnhub.io/api/v1/stock/candle"
        # Calculate date range (1 year of data)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        params = {
            "symbol": symbol,
            "resolution": resolution,
            "from": int(start_date.timestamp()),
            "to": int(end_date.timestamp()),
            "token": settings.FINNHUB_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def fetch_yahoo_finance_data(symbol: str) -> pd.DataFrame:
        """
        Fetch data from Yahoo Finance using yfinance.
        
        Args:
            symbol: Asset symbol.
            
        Returns:
            DataFrame with historical data.
        """
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2y")
            return hist
        except Exception as e:
            logger.error(f"Error fetching data from Yahoo Finance: {e}")
            return pd.DataFrame()

    @staticmethod
    def get_asset_by_symbol(db: Session, symbol: str) -> Optional[Asset]:
        """
        Get asset by symbol.
        
        Args:
            db: Database session.
            symbol: Asset symbol.
            
        Returns:
            Asset if found, None otherwise.
        """
        return db.query(Asset).filter(Asset.symbol == symbol).first()

    @staticmethod
    def create_asset(db: Session, asset: AssetCreate) -> Asset:
        """
        Create a new asset.
        
        Args:
            db: Database session.
            asset: Asset data.
            
        Returns:
            Created asset.
        """
        db_asset = Asset(**asset.model_dump())
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        return db_asset

    @staticmethod
    def create_market_data(db: Session, market_data: MarketDataCreate) -> MarketData:
        """
        Create market data entry.
        
        Args:
            db: Database session.
            market_data: Market data.
            
        Returns:
            Created market data.
        """
        db_market_data = MarketData(**market_data.model_dump())
        db.add(db_market_data)
        db.commit()
        db.refresh(db_market_data)
        return db_market_data

    @staticmethod
    def create_economic_indicator(db: Session, indicator: EconomicIndicatorCreate) -> EconomicIndicator:
        """
        Create economic indicator entry.
        
        Args:
            db: Database session.
            indicator: Economic indicator data.
            
        Returns:
            Created economic indicator.
        """
        db_indicator = EconomicIndicator(**indicator.model_dump())
        db.add(db_indicator)
        db.commit()
        db.refresh(db_indicator)
        return db_indicator

    @staticmethod
    def create_market_metric(db: Session, metric: MarketMetricCreate) -> MarketMetric:
        """
        Create market metric entry.
        
        Args:
            db: Database session.
            metric: Market metric data.
            
        Returns:
            Created market metric.
        """
        db_metric = MarketMetric(**metric.model_dump())
        db.add(db_metric)
        db.commit()
        db.refresh(db_metric)
        return db_metric

    @staticmethod
    def get_assets(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        asset_class: Optional[AssetClass] = None
    ) -> Tuple[List[Asset], int]:
        """
        Get assets with optional filtering.
        
        Args:
            db: Database session.
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            asset_class: Filter by asset class.
            
        Returns:
            List of assets and total count.
        """
        query = db.query(Asset)
        
        if asset_class:
            query = query.filter(Asset.asset_class == asset_class)
            
        total = query.count()
        assets = query.offset(skip).limit(limit).all()
        
        return assets, total

    @staticmethod
    def get_market_data(
        db: Session, 
        filter_params: MarketDataFilter
    ) -> Tuple[List[MarketData], int]:
        """
        Get market data with filtering.
        
        Args:
            db: Database session.
            filter_params: Filter parameters.
            
        Returns:
            List of market data points and total count.
        """
        query = db.query(MarketData).join(Asset)
        
        if filter_params.asset_class:
            query = query.filter(Asset.asset_class == filter_params.asset_class)
            
        if filter_params.symbols:
            query = query.filter(Asset.symbol.in_(filter_params.symbols))
            
        if filter_params.start_date:
            query = query.filter(MarketData.timestamp >= filter_params.start_date)
            
        if filter_params.end_date:
            query = query.filter(MarketData.timestamp <= filter_params.end_date)
            
        total = query.count()
        market_data = query.order_by(MarketData.timestamp.desc()).offset(filter_params.offset).limit(filter_params.limit).all()
        
        return market_data, total

    @staticmethod
    def get_time_series_data(
        db: Session,
        asset_id: int,
        metric: str = "close_price",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> MarketDataTimeSeries:
        """
        Get time series data for an asset.
        
        Args:
            db: Database session.
            asset_id: Asset ID.
            metric: Metric to retrieve (e.g., close_price).
            start_date: Start date for filtering.
            end_date: End date for filtering.
            
        Returns:
            Time series data.
        """
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise ValueError(f"Asset with ID {asset_id} not found")
            
        query = db.query(MarketData).filter(MarketData.asset_id == asset_id)
        
        if start_date:
            query = query.filter(MarketData.timestamp >= start_date)
            
        if end_date:
            query = query.filter(MarketData.timestamp <= end_date)
            
        data_points = query.order_by(MarketData.timestamp).all()
        
        time_series_points = []
        for point in data_points:
            value = getattr(point, metric, None)
            if value is not None:
                time_series_points.append(
                    MarketDataTimeSeriesPoint(timestamp=point.timestamp, value=value)
                )
                
        return MarketDataTimeSeries(
            asset_id=asset_id,
            asset_symbol=asset.symbol,
            asset_name=asset.name,
            metric=metric,
            data=time_series_points
        )

    @staticmethod
    def get_economic_indicators(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        region: Optional[str] = None
    ) -> Tuple[List[EconomicIndicator], int]:
        """
        Get economic indicators with optional filtering.
        
        Args:
            db: Database session.
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            region: Filter by region.
            
        Returns:
            List of economic indicators and total count.
        """
        query = db.query(EconomicIndicator)
        
        if region:
            query = query.filter(EconomicIndicator.region == region)
            
        total = query.count()
        indicators = query.order_by(EconomicIndicator.timestamp.desc()).offset(skip).limit(limit).all()
        
        return indicators, total

    @staticmethod
    def get_market_metrics(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        asset_id: Optional[int] = None,
        metric_name: Optional[str] = None
    ) -> Tuple[List[MarketMetric], int]:
        """
        Get market metrics with optional filtering.
        
        Args:
            db: Database session.
            skip: Number of records to skip.
            limit: Maximum number of records to return.
            asset_id: Filter by asset ID.
            metric_name: Filter by metric name.
            
        Returns:
            List of market metrics and total count.
        """
        query = db.query(MarketMetric)
        
        if asset_id:
            query = query.filter(MarketMetric.asset_id == asset_id)
            
        if metric_name:
            query = query.filter(MarketMetric.name == metric_name)
            
        total = query.count()
        metrics = query.order_by(MarketMetric.timestamp.desc()).offset(skip).limit(limit).all()
        
        return metrics, total

    @staticmethod
    async def process_alpha_vantage_data(
        db: Session,
        symbol: str,
        data: Dict[str, Any],
        asset_class: AssetClass
    ) -> List[MarketData]:
        """
        Process and store data from Alpha Vantage.
        
        Args:
            db: Database session.
            symbol: Asset symbol.
            data: API response data.
            asset_class: Asset class.
            
        Returns:
            List of created market data entries.
        """
        # Check if asset exists, create if not
        asset = MarketDataService.get_asset_by_symbol(db, symbol)
        if not asset:
            asset_name = data.get("Meta Data", {}).get("2. Symbol", symbol)
            asset_create = AssetCreate(
                symbol=symbol,
                name=asset_name,
                asset_class=asset_class,
                description=f"Data from Alpha Vantage for {symbol}"
            )
            asset = MarketDataService.create_asset(db, asset_create)
            
        # Process time series data
        time_series_key = next((k for k in data.keys() if "Time Series" in k), None)
        if not time_series_key or not data.get(time_series_key):
            logger.warning(f"No time series data found for {symbol}")
            return []
            
        time_series = data[time_series_key]
        created_entries = []
        
        for date_str, values in time_series.items():
            try:
                timestamp = datetime.strptime(date_str, "%Y-%m-%d")
                market_data_create = MarketDataCreate(
                    asset_id=asset.id,
                    timestamp=timestamp,
                    open_price=float(values.get("1. open", 0)),
                    high_price=float(values.get("2. high", 0)),
                    low_price=float(values.get("3. low", 0)),
                    close_price=float(values.get("4. close", 0)),
                    volume=float(values.get("5. volume", 0)),
                    source="Alpha Vantage"
                )
                market_data = MarketDataService.create_market_data(db, market_data_create)
                created_entries.append(market_data)
            except Exception as e:
                logger.error(f"Error processing data for {date_str}: {e}")
                
        return created_entries

    @staticmethod
    async def process_finnhub_data(
        db: Session,
        symbol: str,
        data: Dict[str, Any],
        asset_class: AssetClass
    ) -> List[MarketData]:
        """
        Process and store data from Finnhub.
        
        Args:
            db: Database session.
            symbol: Asset symbol.
            data: API response data.
            asset_class: Asset class.
            
        Returns:
            List of created market data entries.
        """
        # Check if asset exists, create if not
        asset = MarketDataService.get_asset_by_symbol(db, symbol)
        if not asset:
            asset_create = AssetCreate(
                symbol=symbol,
                name=symbol,  # Finnhub doesn't provide a name, use symbol
                asset_class=asset_class,
                description=f"Data from Finnhub for {symbol}"
            )
            asset = MarketDataService.create_asset(db, asset_create)
            
        # Process candle data
        if data.get("s") != "ok" or not data.get("t"):
            logger.warning(f"No valid data found for {symbol}")
            return []
            
        timestamps = data.get("t", [])
        opens = data.get("o", [])
        highs = data.get("h", [])
        lows = data.get("l", [])
        closes = data.get("c", [])
        volumes = data.get("v", [])
        
        created_entries = []
        
        for i in range(len(timestamps)):
            try:
                timestamp = datetime.fromtimestamp(timestamps[i])
                market_data_create = MarketDataCreate(
                    asset_id=asset.id,
                    timestamp=timestamp,
                    open_price=opens[i] if i < len(opens) else None,
                    high_price=highs[i] if i < len(highs) else None,
                    low_price=lows[i] if i < len(lows) else None,
                    close_price=closes[i] if i < len(closes) else 0,
                    volume=volumes[i] if i < len(volumes) else None,
                    source="Finnhub"
                )
                market_data = MarketDataService.create_market_data(db, market_data_create)
                created_entries.append(market_data)
            except Exception as e:
                logger.error(f"Error processing data for index {i}: {e}")
                
        return created_entries

    @staticmethod
    async def process_yahoo_finance_data(
        db: Session,
        symbol: str,
        data: pd.DataFrame,
        asset_class: AssetClass
    ) -> List[MarketData]:
        """
        Process and store data from Yahoo Finance.
        
        Args:
            db: Database session.
            symbol: Asset symbol.
            data: DataFrame with historical data.
            asset_class: Asset class.
            
        Returns:
            List of created market data entries.
        """
        if data.empty:
            logger.warning(f"No data found for {symbol}")
            return []
            
        # Check if asset exists, create if not
        asset = MarketDataService.get_asset_by_symbol(db, symbol)
        if not asset:
            asset_create = AssetCreate(
                symbol=symbol,
                name=symbol,  # Yahoo Finance doesn't provide a name in the DataFrame
                asset_class=asset_class,
                description=f"Data from Yahoo Finance for {symbol}"
            )
            asset = MarketDataService.create_asset(db, asset_create)
            
        created_entries = []
        
        for index, row in data.iterrows():
            try:
                market_data_create = MarketDataCreate(
                    asset_id=asset.id,
                    timestamp=index.to_pydatetime(),
                    open_price=row.get("Open"),
                    high_price=row.get("High"),
                    low_price=row.get("Low"),
                    close_price=row.get("Close"),
                    volume=row.get("Volume"),
                    source="Yahoo Finance"
                )
                market_data = MarketDataService.create_market_data(db, market_data_create)
                created_entries.append(market_data)
            except Exception as e:
                logger.error(f"Error processing data for {index}: {e}")
                
        return created_entries

    @staticmethod
    async def refresh_market_data(
        db: Session,
        symbols: List[str],
        asset_class: AssetClass,
        data_source: str = "alpha_vantage"
    ) -> Dict[str, int]:
        """
        Refresh market data for multiple symbols.
        
        Args:
            db: Database session.
            symbols: List of asset symbols.
            asset_class: Asset class.
            data_source: Data source to use.
            
        Returns:
            Dictionary with symbols and count of entries created.
        """
        results = {}
        
        for symbol in symbols:
            try:
                if data_source == "alpha_vantage":
                    data = await MarketDataService.fetch_alpha_vantage_data(symbol)
                    entries = await MarketDataService.process_alpha_vantage_data(db, symbol, data, asset_class)
                elif data_source == "finnhub":
                    data = await MarketDataService.fetch_finnhub_data(symbol)
                    entries = await MarketDataService.process_finnhub_data(db, symbol, data, asset_class)
                elif data_source == "yahoo_finance":
                    data = await MarketDataService.fetch_yahoo_finance_data(symbol)
                    entries = await MarketDataService.process_yahoo_finance_data(db, symbol, data, asset_class)
                else:
                    logger.error(f"Unknown data source: {data_source}")
                    continue
                    
                results[symbol] = len(entries)
            except Exception as e:
                logger.error(f"Error refreshing data for {symbol}: {e}")
                results[symbol] = 0
                
        return results

    @staticmethod
    def calculate_market_metrics(db: Session, asset_id: int) -> List[MarketMetric]:
        """
        Calculate and store market metrics for an asset.
        
        Args:
            db: Database session.
            asset_id: Asset ID.
            
        Returns:
            List of created market metrics.
        """
        # Get market data for the asset
        market_data = db.query(MarketData).filter(
            MarketData.asset_id == asset_id
        ).order_by(MarketData.timestamp).all()
        
        if not market_data:
            logger.warning(f"No market data found for asset ID {asset_id}")
            return []
            
        created_metrics = []
        
        # Calculate volatility (standard deviation of returns)
        if len(market_data) > 1:
            prices = [data.close_price for data in market_data if data.close_price]
            returns = [prices[i] / prices[i-1] - 1 for i in range(1, len(prices))]
            
            if returns:
                import numpy as np
                volatility = float(np.std(returns) * np.sqrt(252))  # Annualized
                
                metric_create = MarketMetricCreate(
                    asset_id=asset_id,
                    name="volatility",
                    value=volatility,
                    timestamp=datetime.utcnow()
                )
                metric = MarketDataService.create_market_metric(db, metric_create)
                created_metrics.append(metric)
                
        # Calculate moving averages
        if len(market_data) >= 50:
            prices = [data.close_price for data in market_data if data.close_price]
            
            # 50-day moving average
            ma_50 = sum(prices[-50:]) / 50
            metric_create = MarketMetricCreate(
                asset_id=asset_id,
                name="ma_50",
                value=ma_50,
                timestamp=datetime.utcnow()
            )
            metric = MarketDataService.create_market_metric(db, metric_create)
            created_metrics.append(metric)
            
            # 200-day moving average if enough data
            if len(prices) >= 200:
                ma_200 = sum(prices[-200:]) / 200
                metric_create = MarketMetricCreate(
                    asset_id=asset_id,
                    name="ma_200",
                    value=ma_200,
                    timestamp=datetime.utcnow()
                )
                metric = MarketDataService.create_market_metric(db, metric_create)
                created_metrics.append(metric)
                
        return created_metrics
