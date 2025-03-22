# Market Data Dashboard

## Overview
The Market Data Dashboard is an educational tool that visualizes real-time market metrics across multiple asset classes. It provides interactive visualizations, educational content, and real-time data updates.

## Features
- **Live Data Display**: View market data for multiple asset classes (equities, fixed income, derivatives, currencies, commodities)
- **Interactive Visualizations**: Filter and view data by asset class and time range
- **Manual Data Refresh**: Refresh data on-demand with a single click
- **Educational Content**: Learn about different asset classes and market metrics through tooltips and dedicated educational sections
- **Asset Class Tabs**: Navigate between different asset classes with self-contained tabs

## Components
The dashboard is built with the following components:

1. **DashboardHeader**: Displays the title, description, and refresh button
2. **EconomicIndicatorsPanel**: Shows key economic indicators with tooltips
3. **TrendingAssetsPanel**: Displays trending assets with price and volatility information
4. **MarketDataChart**: Interactive chart for visualizing asset price history
5. **MarketMetricsPanel**: Tabular view of market metrics for selected assets
6. **AssetClassOverview**: Dedicated view for each asset class with educational content

## Data Sources
- Alpha Vantage API
- Finnhub API
- Yahoo Finance (unofficial)

## Usage
1. Navigate to the Market Data Dashboard page
2. Use the tabs to switch between the overview and specific asset classes
3. Click the "Refresh Data" button to get the latest market data
4. Interact with charts by selecting assets and time ranges
5. Hover over metrics and indicators to see educational tooltips

## Technical Implementation
- **Frontend**: Next.js with Tailwind CSS and shadcn UI components
- **Backend**: FastAPI endpoints for market data
- **Data Storage**: PostgreSQL database for historical market data

## Future Enhancements
- Automated data refresh
- Additional visualization types
- More detailed educational content
- Integration with calculators for financial analysis
