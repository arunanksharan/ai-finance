/**
 * API client for market data.
 */
import { 
  AssetClass, 
  Asset, 
  MarketData, 
  EconomicIndicator, 
  MarketMetric,
  DashboardSummary,
  MarketDataTimeSeries,
  AssetList,
  MarketDataList,
  EconomicIndicatorList,
  MarketMetricList,
  MarketDataFilter
} from '@/types/market-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

/**
 * Fetch dashboard summary.
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/market-data/dashboard-summary`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch assets.
 */
export async function fetchAssets(
  skip: number = 0,
  limit: number = 100,
  assetClass?: AssetClass,
  search?: string
): Promise<AssetList> {
  let url = `${API_BASE_URL}/market-data/assets?skip=${skip}&limit=${limit}`;
  
  if (assetClass) {
    url += `&asset_class=${assetClass}`;
  }
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Create asset.
 */
export async function createAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
  const response = await fetch(`${API_BASE_URL}/market-data/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create asset: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch market data.
 */
export async function fetchMarketData(filter: MarketDataFilter): Promise<MarketDataList> {
  let url = `${API_BASE_URL}/market-data/market-data?`;
  
  if (filter.assetClass) {
    url += `&asset_class=${filter.assetClass}`;
  }
  
  if (filter.region) {
    url += `&region=${encodeURIComponent(filter.region)}`;
  }
  
  if (filter.sector) {
    url += `&sector=${encodeURIComponent(filter.sector)}`;
  }
  
  if (filter.startDate) {
    url += `&start_date=${filter.startDate}`;
  }
  
  if (filter.endDate) {
    url += `&end_date=${filter.endDate}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch time series data.
 */
export async function fetchTimeSeries(
  assetId: number,
  metric: string = 'close_price',
  startDate?: string,
  endDate?: string
): Promise<MarketDataTimeSeries> {
  const url = `${API_BASE_URL}/market-data/assets/${assetId}/time-series?metric=${metric}&start_date=${startDate}&end_date=${endDate}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch time series data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetches economic indicators with pagination and filtering options
 */
export async function fetchEconomicIndicators(
  skip: number = 0,
  limit: number = 10,
  region?: string
): Promise<EconomicIndicatorList> {
  let url = `${API_BASE_URL}/market-data/economic-indicators?skip=${skip}&limit=${limit}`;
  
  if (region) {
    url += `&region=${encodeURIComponent(region)}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch economic indicators: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Fetch market metrics.
 */
export async function fetchMarketMetrics(
  skip: number = 0,
  limit: number = 100,
  assetId?: number,
  metricName?: string
): Promise<MarketMetricList> {
  const url = new URL(`${API_BASE_URL}/market-data/market-metrics`);
  
  url.searchParams.append('skip', skip.toString());
  url.searchParams.append('limit', limit.toString());
  
  if (assetId) {
    url.searchParams.append('asset_id', assetId.toString());
  }
  
  if (metricName) {
    url.searchParams.append('metric_name', metricName);
  }
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to fetch market metrics: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Refresh market data.
 */
export async function refreshMarketData(
  symbols: string[],
  assetClass: AssetClass,
  dataSource: string = 'alpha_vantage'
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/market-data/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symbols,
      asset_class: assetClass,
      data_source: dataSource,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to refresh market data: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Calculate metrics for an asset.
 */
export async function calculateMetrics(assetId: number): Promise<MarketMetric[]> {
  const response = await fetch(`${API_BASE_URL}/market-data/calculate-metrics/${assetId}`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to calculate metrics: ${response.statusText}`);
  }
  
  return await response.json();
}
