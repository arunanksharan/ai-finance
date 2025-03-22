import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetWithLatestData } from "@/types/market-data";
import { fetchTimeSeries } from "@/services/market-data";

interface MarketDataChartProps {
  data: AssetWithLatestData[];
  type: "line" | "bar";
  metric: string;
}

export default function MarketDataChart({
  data,
  type = "line",
  metric = "close_price",
}: MarketDataChartProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>("1m");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Available assets for selection
  const availableAssets = useMemo(() => {
    return data.map((item) => ({
      id: item.asset.id,
      symbol: item.asset.symbol,
      name: item.asset.name,
    }));
  }, [data]);

  // Available metrics for selection
  const metrics = [
    { value: "close_price", label: "Close Price" },
    { value: "open_price", label: "Open Price" },
    { value: "high_price", label: "High Price" },
    { value: "low_price", label: "Low Price" },
    { value: "volume", label: "Volume" },
  ];

  // Time range options
  const timeRanges = [
    { value: "1w", label: "1 Week" },
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
    { value: "2y", label: "2 Years" },
  ];

  // Load time series data for selected assets
  const loadTimeSeriesData = async (assetIds: number[]) => {
    if (assetIds.length === 0) return;
    
    setIsLoading(true);
    try {
      // Calculate date range based on selected time range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case "1w":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "1m":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case "2y":
          startDate.setFullYear(endDate.getFullYear() - 2);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }
      
      // Format dates for API
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Fetch data for each asset
      const seriesPromises = assetIds.map((assetId) => 
        fetchTimeSeries(assetId, metric, startDateStr, endDateStr)
      );
      
      const seriesResults = await Promise.all(seriesPromises);
      
      // Process and combine the data
      const combinedData: Record<string, any> = {};
      
      seriesResults.forEach((series) => {
        series.data.forEach((point: any) => {
          const date = new Date(point.timestamp).toLocaleDateString();
          
          if (!combinedData[date]) {
            combinedData[date] = { date };
          }
          
          combinedData[date][series.asset_symbol] = point.value;
        });
      });
      
      // Convert to array for Recharts
      const chartData = Object.values(combinedData).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setChartData(chartData);
    } catch (error) {
      console.error("Error loading time series data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle asset selection change
  const handleAssetChange = (assetSymbol: string) => {
    const newSelectedAssets = [...selectedAssets];
    
    if (newSelectedAssets.includes(assetSymbol)) {
      // Remove asset if already selected
      const index = newSelectedAssets.indexOf(assetSymbol);
      newSelectedAssets.splice(index, 1);
    } else {
      // Add asset if not already selected (limit to 5)
      if (newSelectedAssets.length < 5) {
        newSelectedAssets.push(assetSymbol);
      }
    }
    
    setSelectedAssets(newSelectedAssets);
    
    // Get asset IDs for selected symbols
    const assetIds = data
      .filter((item) => newSelectedAssets.includes(item.asset.symbol))
      .map((item) => item.asset.id);
    
    loadTimeSeriesData(assetIds);
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    
    // Get asset IDs for selected symbols
    const assetIds = data
      .filter((item) => selectedAssets.includes(item.asset.symbol))
      .map((item) => item.asset.id);
    
    loadTimeSeriesData(assetIds);
  };

  // Generate random colors for chart lines
  const getLineColor = (index: number) => {
    const colors = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
      "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {availableAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleAssetChange(asset.symbol)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedAssets.includes(asset.symbol)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {asset.symbol}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Tabs defaultValue={type} className="w-full">
            <div className="flex justify-end p-4">
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="line" className="mt-0">
              <div className="h-[400px] w-full p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Select assets to display chart data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedAssets.map((symbol, index) => (
                        <Line
                          key={symbol}
                          type="monotone"
                          dataKey={symbol}
                          stroke={getLineColor(index)}
                          activeDot={{ r: 8 }}
                          name={symbol}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bar" className="mt-0">
              <div className="h-[400px] w-full p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Select assets to display chart data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {selectedAssets.map((symbol, index) => (
                        <Bar
                          key={symbol}
                          dataKey={symbol}
                          fill={getLineColor(index)}
                          name={symbol}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
