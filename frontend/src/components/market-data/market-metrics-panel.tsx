import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AssetWithLatestData } from "@/types/market-data";

interface MarketMetricsPanelProps {
  assets: AssetWithLatestData[];
  isLoading?: boolean;
}

export default function MarketMetricsPanel({
  assets,
  isLoading = false,
}: MarketMetricsPanelProps) {
  // Metric descriptions for tooltips
  const metricDescriptions: Record<string, string> = {
    "volatility": "A statistical measure of the dispersion of returns for a given security or market index. Higher volatility means the price can change dramatically over a short time period.",
    "ma_50": "50-day Moving Average - The average closing price over the last 50 trading days. Used to identify trend direction and potential support/resistance levels.",
    "ma_200": "200-day Moving Average - The average closing price over the last 200 trading days. A key long-term trend indicator.",
    "rsi": "Relative Strength Index - Measures the speed and change of price movements on a scale from 0 to 100. Values above 70 indicate overbought conditions, while values below 30 indicate oversold conditions.",
    "beta": "Measures a stock's volatility in relation to the overall market. A beta greater than 1 indicates higher volatility than the market, while less than 1 indicates lower volatility.",
  };

  // Format metric value
  const formatMetricValue = (name: string, value: number): string => {
    if (name === "volatility") {
      return `${(value * 100).toFixed(2)}%`;
    }
    if (name.startsWith("ma_")) {
      return value.toFixed(2);
    }
    return value.toString();
  };

  // Format metric name for display
  const formatMetricName = (name: string): string => {
    if (name === "volatility") return "Volatility";
    if (name === "ma_50") return "50-Day MA";
    if (name === "ma_200") return "200-Day MA";
    if (name === "rsi") return "RSI";
    if (name === "beta") return "Beta";
    
    // Default formatting for other metrics
    return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : assets.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No assets available</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Latest Price</TableHead>
                <TableHead>Volatility</TableHead>
                <TableHead>50-Day MA</TableHead>
                <TableHead>200-Day MA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((assetData) => {
                // Find metrics
                const volatilityMetric = assetData.metrics.find(m => m.name === "volatility");
                const ma50Metric = assetData.metrics.find(m => m.name === "ma_50");
                const ma200Metric = assetData.metrics.find(m => m.name === "ma_200");
                
                return (
                  <TableRow key={assetData.asset.id}>
                    <TableCell className="font-medium">{assetData.asset.name}</TableCell>
                    <TableCell>{assetData.asset.symbol}</TableCell>
                    <TableCell>
                      {assetData.latest_data?.close_price 
                        ? `$${assetData.latest_data.close_price.toFixed(2)}` 
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {volatilityMetric 
                          ? formatMetricValue("volatility", volatilityMetric.value) 
                          : "N/A"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{metricDescriptions["volatility"]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {ma50Metric 
                          ? `$${ma50Metric.value.toFixed(2)}` 
                          : "N/A"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{metricDescriptions["ma_50"]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {ma200Metric 
                          ? `$${ma200Metric.value.toFixed(2)}` 
                          : "N/A"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{metricDescriptions["ma_200"]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
