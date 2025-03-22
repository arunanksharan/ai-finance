"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { AssetClass } from "@/types/market-data";
import DashboardHeader from "@/components/market-data/dashboard-header";
import AssetClassOverview from "@/components/market-data/asset-class-overview";
import MarketDataChart from "@/components/market-data/market-data-chart";
import EconomicIndicatorsPanel from "@/components/market-data/economic-indicators-panel";
import TrendingAssetsPanel from "@/components/market-data/trending-assets-panel";
import MarketMetricsPanel from "@/components/market-data/market-metrics-panel";
import { fetchDashboardSummary, fetchEconomicIndicators } from "@/lib/api/market-data";

export default function MarketDataDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [economicIndicators, setEconomicIndicators] = useState<any[]>([]);
  const [trendingAssets, setTrendingAssets] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Fetch dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard summary
      const summary = await fetchDashboardSummary();
      setDashboardData(summary);
      setTrendingAssets(summary.trending_assets);
      
      // Fetch economic indicators
      const indicators = await fetchEconomicIndicators();
      setEconomicIndicators(indicators.items);
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load market data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/market-data-dashboard?tab=${value}`, { scroll: false });
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadDashboardData();
    toast({
      title: "Refreshing Data",
      description: "Fetching the latest market data...",
    });
  };

  // Load data on initial render
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <DashboardHeader 
        onRefresh={handleRefresh} 
        lastUpdated={lastUpdated} 
        isLoading={isLoading} 
      />

      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equities">Equities</TabsTrigger>
          <TabsTrigger value="fixed-income">Fixed Income</TabsTrigger>
          <TabsTrigger value="derivatives">Derivatives</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Key market indicators across asset classes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <MarketDataChart 
                    data={dashboardData?.trending_assets || []} 
                    type="line"
                    metric="close_price"
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <EconomicIndicatorsPanel 
                indicators={economicIndicators} 
                isLoading={isLoading} 
              />
              
              <TrendingAssetsPanel 
                assets={trendingAssets} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </TabsContent>

        {/* Asset Class Specific Tabs */}
        <TabsContent value="equities" className="mt-6">
          <AssetClassOverview assetClass={AssetClass.EQUITY} />
        </TabsContent>

        <TabsContent value="fixed-income" className="mt-6">
          <AssetClassOverview assetClass={AssetClass.FIXED_INCOME} />
        </TabsContent>

        <TabsContent value="derivatives" className="mt-6">
          <AssetClassOverview assetClass={AssetClass.DERIVATIVE} />
        </TabsContent>

        <TabsContent value="currencies" className="mt-6">
          <AssetClassOverview assetClass={AssetClass.CURRENCY} />
        </TabsContent>

        <TabsContent value="commodities" className="mt-6">
          <AssetClassOverview assetClass={AssetClass.COMMODITY} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
