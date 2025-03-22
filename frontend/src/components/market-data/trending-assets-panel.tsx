import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetWithLatestData } from "@/types/market-data";
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from "lucide-react";

interface TrendingAssetsPanelProps {
  assets: AssetWithLatestData[];
  isLoading: boolean;
}

export default function TrendingAssetsPanel({
  assets,
  isLoading,
}: TrendingAssetsPanelProps) {
  // Helper function to calculate percentage change
  const calculateChange = (asset: AssetWithLatestData): number | null => {
    // Find volatility metric if available
    const volatilityMetric = asset.metrics.find(
      (metric) => metric.name === "volatility"
    );
    
    if (volatilityMetric) {
      return volatilityMetric.value;
    }
    
    return null;
  };

  // Helper function to determine trend direction
  const getTrendIndicator = (change: number | null) => {
    if (change === null) return <ArrowRightIcon className="h-4 w-4 text-yellow-500" />;
    if (change > 0.2) return <ArrowUpIcon className="h-4 w-4 text-red-500" />;
    if (change > 0.1) return <ArrowUpIcon className="h-4 w-4 text-orange-500" />;
    if (change < 0.05) return <ArrowDownIcon className="h-4 w-4 text-green-500" />;
    return <ArrowRightIcon className="h-4 w-4 text-yellow-500" />;
  };

  // Helper function to format price
  const formatPrice = (price?: number): string => {
    if (price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Trending Assets</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trending assets available</p>
        ) : (
          <div className="space-y-3">
            {assets.slice(0, 5).map((asset) => {
              const change = calculateChange(asset);
              return (
                <div
                  key={asset.asset.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{asset.asset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {asset.asset.symbol} • {asset.asset.asset_class.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">
                      {formatPrice(asset.latest_data?.close_price)}
                    </span>
                    <div className="flex items-center">
                      {getTrendIndicator(change)}
                      <span className="text-xs ml-1">
                        {change !== null ? `${(change * 100).toFixed(2)}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
