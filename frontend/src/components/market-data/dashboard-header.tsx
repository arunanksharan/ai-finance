import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  lastUpdated: Date;
  isLoading: boolean;
}

export default function DashboardHeader({
  onRefresh,
  lastUpdated,
  isLoading,
}: DashboardHeaderProps) {
  // Format the last updated time
  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Market Data Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visualize and analyze real-time market metrics across asset classes
        </p>
      </div>
      <div className="flex flex-col items-end mt-4 md:mt-0">
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {formatLastUpdated(lastUpdated)}
        </p>
      </div>
    </div>
  );
}
