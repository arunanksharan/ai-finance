/**
 * Enum for asset classes
 */
export enum AssetClass {
  EQUITY = "equity",
  FIXED_INCOME = "fixed_income",
  DERIVATIVE = "derivative",
  CURRENCY = "currency",
  COMMODITY = "commodity"
}

/**
 * Asset interface
 */
export interface Asset {
  id: number;
  name: string;
  symbol: string;
  description?: string;
  asset_class: AssetClass;
  region?: string;
  sector?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Market data interface
 */
export interface MarketData {
  id: number;
  asset_id: number;
  timestamp: string;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price?: number;
  volume?: number;
  created_at: string;
  updated_at: string;
  source: string;
}

/**
 * Economic indicator interface
 */
export interface EconomicIndicator {
  id: number;
  name: string;
  value: number;
  timestamp: string;
  region: string;
  description?: string;
  created_at: string;
  updated_at: string;
  source: string;
}

/**
 * Market metric interface
 */
export interface MarketMetric {
  id: number;
  asset_id: number;
  name: string;
  value: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

/**
 * Asset with latest data and metrics
 */
export interface AssetWithLatestData {
  asset: Asset;
  latest_data?: MarketData;
  metrics: MarketMetric[];
}

/**
 * Dashboard summary interface
 */
export interface DashboardSummary {
  trending_assets: AssetWithLatestData[];
  latest_economic_indicators: EconomicIndicator[];
}

/**
 * Asset list response
 */
export interface AssetList {
  items: Asset[];
  total: number;
}

/**
 * Market data list response
 */
export interface MarketDataList {
  items: MarketData[];
  total: number;
}

/**
 * Economic indicator list response
 */
export interface EconomicIndicatorList {
  items: EconomicIndicator[];
  total: number;
}

/**
 * Market metric list response
 */
export interface MarketMetricList {
  items: MarketMetric[];
  total: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

/**
 * Market data time series response
 */
export interface MarketDataTimeSeries {
  asset_id: number;
  asset_symbol: string;
  metric: string;
  data: TimeSeriesDataPoint[];
}

/**
 * Market data filter options
 */
export interface MarketDataFilter {
  assetClass?: AssetClass;
  region?: string;
  sector?: string;
  startDate?: string;
  endDate?: string;
}
