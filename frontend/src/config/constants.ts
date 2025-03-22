// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Calculator constants
export const CALCULATION_METHODS = {
  GRID: "grid",
  SIMM: "simm",
};

export const CONFIDENCE_LEVELS = {
  NINETY_FIVE: "95",
  NINETY_NINE: "99",
};

export const TIME_HORIZONS = {
  TEN_DAYS: "10d",
  ONE_MONTH: "1m",
  THREE_MONTHS: "3m",
  SIX_MONTHS: "6m",
  ONE_YEAR: "1y",
};

export const ASSET_CLASSES = [
  "interest_rate",
  "credit",
  "equity",
  "commodity",
  "fx",
];
