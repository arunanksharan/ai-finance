import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AssetClass } from "@/types/market-data";
import MarketDataChart from "./market-data-chart";
import MarketMetricsPanel from "./market-metrics-panel";
import { fetchAssets, refreshMarketData } from "@/services/market-data";

interface AssetClassOverviewProps {
  assetClass: AssetClass;
}

export default function AssetClassOverview({ assetClass }: AssetClassOverviewProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("close_price");

  // Asset class descriptions for educational content
  const assetClassDescriptions: Record<AssetClass, { description: string; examples: string[] }> = {
    [AssetClass.EQUITY]: {
      description: "Equities represent ownership in a company. When you buy a stock, you're purchasing a share of the company's assets and earnings.",
      examples: ["Common Stocks", "Preferred Stocks", "ADRs (American Depositary Receipts)", "ETFs (Exchange-Traded Funds)"]
    },
    [AssetClass.FIXED_INCOME]: {
      description: "Fixed income securities are investments that provide a return in the form of fixed periodic payments and eventual return of principal at maturity.",
      examples: ["Government Bonds", "Corporate Bonds", "Municipal Bonds", "Treasury Bills", "Certificates of Deposit"]
    },
    [AssetClass.DERIVATIVE]: {
      description: "Derivatives are financial contracts that derive their value from an underlying asset. They are used for hedging risk or speculating on price movements.",
      examples: ["Options", "Futures", "Swaps", "Forwards", "Warrants"]
    },
    [AssetClass.CURRENCY]: {
      description: "Currency markets involve the trading of one currency for another. The forex market is the largest and most liquid financial market in the world.",
      examples: ["Major Pairs (EUR/USD, GBP/USD)", "Minor Pairs (EUR/GBP, USD/CAD)", "Exotic Pairs (USD/TRY, USD/ZAR)"]
    },
    [AssetClass.COMMODITY]: {
      description: "Commodities are raw materials or primary agricultural products that can be bought and sold, such as gold, oil, or agricultural products.",
      examples: ["Precious Metals (Gold, Silver)", "Energy (Oil, Natural Gas)", "Agriculture (Wheat, Corn, Soybeans)", "Livestock & Meat"]
    }
  };

  // Format asset class name for display
  const formatAssetClassName = (assetClass: AssetClass): string => {
    return assetClass.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Load assets for the selected asset class
  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetchAssets(0, 10, assetClass);
      setAssets(response.items.map(asset => ({ 
        asset,
        latest_data: null,
        metrics: []
      })));
    } catch (error) {
      console.error(`Failed to fetch ${assetClass} assets:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${formatAssetClassName(assetClass)} data. Please try again later.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh market data for the selected asset class
  const handleRefreshData = async () => {
    if (assets.length === 0) return;
    
    setIsRefreshing(true);
    try {
      const symbols = assets.map(item => item.asset.symbol);
      await refreshMarketData(symbols, assetClass, "alpha_vantage");
      
      toast({
        title: "Success",
        description: `${formatAssetClassName(assetClass)} data refreshed successfully.`,
      });
      
      // Reload assets to get updated data
      await loadAssets();
    } catch (error) {
      console.error(`Failed to refresh ${assetClass} data:`, error);
      toast({
        title: "Error",
        description: `Failed to refresh ${formatAssetClassName(assetClass)} data. Please try again later.`,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load assets on initial render
  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetClass]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">{formatAssetClassName(assetClass)}</h2>
          <p className="text-muted-foreground mt-1">
            {assetClassDescriptions[assetClass].description}
          </p>
        </div>
        <Button
          onClick={handleRefreshData}
          disabled={isRefreshing || isLoading}
          className="mt-4 md:mt-0"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">Price Chart</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="education">Learn More</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>
                Historical price data for {formatAssetClassName(assetClass)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <MarketDataChart
                  data={assets}
                  type="line"
                  metric={selectedMetric}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Metrics</CardTitle>
              <CardDescription>
                Key performance metrics for {formatAssetClassName(assetClass)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <MarketMetricsPanel assets={assets} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Learn About {formatAssetClassName(assetClass)}</CardTitle>
              <CardDescription>
                Educational resources and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">What are {formatAssetClassName(assetClass)}?</h3>
                  <p className="text-muted-foreground">
                    {assetClassDescriptions[assetClass].description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Types of {formatAssetClassName(assetClass)}</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {assetClassDescriptions[assetClass].examples.map((example, index) => (
                      <li key={index} className="text-muted-foreground">{example}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Metrics to Watch</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {assetClass === AssetClass.EQUITY && (
                      <>
                        <li className="text-muted-foreground">Price-to-Earnings (P/E) Ratio - Compares a company's share price to its earnings per share</li>
                        <li className="text-muted-foreground">Dividend Yield - Annual dividends paid relative to share price</li>
                        <li className="text-muted-foreground">Market Capitalization - Total value of a company's outstanding shares</li>
                        <li className="text-muted-foreground">Earnings Per Share (EPS) - Company's profit divided by outstanding shares</li>
                      </>
                    )}
                    {assetClass === AssetClass.FIXED_INCOME && (
                      <>
                        <li className="text-muted-foreground">Yield to Maturity - Total return anticipated if held until maturity</li>
                        <li className="text-muted-foreground">Duration - Measure of a bond's sensitivity to interest rate changes</li>
                        <li className="text-muted-foreground">Credit Rating - Assessment of the issuer's creditworthiness</li>
                        <li className="text-muted-foreground">Coupon Rate - Annual interest payment expressed as a percentage</li>
                      </>
                    )}
                    {assetClass === AssetClass.DERIVATIVE && (
                      <>
                        <li className="text-muted-foreground">Implied Volatility - Market's forecast of likely movement in an asset's price</li>
                        <li className="text-muted-foreground">Open Interest - Total number of outstanding derivative contracts</li>
                        <li className="text-muted-foreground">Delta - Rate of change of option price relative to underlying asset</li>
                        <li className="text-muted-foreground">Time Decay - Reduction in option value as expiration approaches</li>
                      </>
                    )}
                    {assetClass === AssetClass.CURRENCY && (
                      <>
                        <li className="text-muted-foreground">Exchange Rate - Value of one currency relative to another</li>
                        <li className="text-muted-foreground">Interest Rate Differential - Difference in interest rates between countries</li>
                        <li className="text-muted-foreground">Purchasing Power Parity - Relative value of currencies based on goods prices</li>
                        <li className="text-muted-foreground">Currency Volatility - Measure of currency price fluctuations</li>
                      </>
                    )}
                    {assetClass === AssetClass.COMMODITY && (
                      <>
                        <li className="text-muted-foreground">Spot Price - Current market price for immediate delivery</li>
                        <li className="text-muted-foreground">Futures Price - Price for delivery at a specified future date</li>
                        <li className="text-muted-foreground">Contango/Backwardation - Relationship between spot and futures prices</li>
                        <li className="text-muted-foreground">Inventory Levels - Available supply of a commodity</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
