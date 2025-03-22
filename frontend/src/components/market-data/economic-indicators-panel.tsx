import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EconomicIndicator } from "@/types/market-data";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EconomicIndicatorsPanelProps {
  indicators: EconomicIndicator[];
  isLoading: boolean;
}

export default function EconomicIndicatorsPanel({
  indicators,
  isLoading,
}: EconomicIndicatorsPanelProps) {
  // Helper function to determine trend direction
  const getTrendClass = (value: number) => {
    if (value > 0) return "text-green-500";
    if (value < 0) return "text-red-500";
    return "text-yellow-500";
  };

  // Indicator descriptions for tooltips
  const indicatorDescriptions: Record<string, string> = {
    "GDP Growth Rate": "The annual rate of change in a country's Gross Domestic Product.",
    "Inflation Rate": "The annual rate at which the general level of prices for goods and services is rising.",
    "Unemployment Rate": "The percentage of the labor force that is jobless and actively seeking employment.",
    "Interest Rate": "The central bank's key interest rate that influences borrowing costs throughout the economy.",
    "Consumer Confidence": "An economic indicator that measures the degree of optimism consumers feel about the economy.",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Economic Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : indicators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No indicators available</p>
        ) : (
          <div className="space-y-3">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium">{indicator.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoCircledIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {indicatorDescriptions[indicator.name] ||
                            `${indicator.name} for ${indicator.region}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {indicator.region}
                  </span>
                  <span
                    className={`text-sm font-semibold ${getTrendClass(
                      indicator.value
                    )}`}
                  >
                    {indicator.value.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
