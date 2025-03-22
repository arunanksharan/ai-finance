"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Define the SACCR result type
type SACCRResult = {
  replacement_cost: number;
  potential_future_exposure: number;
  exposure_at_default: number;
  asset_class_breakdown: {
    asset_class: string;
    exposure: number;
    percentage: number;
  }[];
  transaction_results: Record<string, {
    replacement_cost: number;
    potential_future_exposure: number;
    exposure_at_default: number;
  }>;
};

interface SACCRResultsDisplayProps {
  result: SACCRResult;
}

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function SACCRResultsDisplay({ result }: SACCRResultsDisplayProps) {
  // Format the asset class name for display
  const formatAssetClass = (assetClass: string) => {
    return assetClass
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Prepare data for the asset class breakdown chart
  const assetClassData = result.asset_class_breakdown.map(item => ({
    name: formatAssetClass(item.asset_class),
    value: item.exposure,
    percentage: item.percentage,
  }));

  // Prepare data for the transaction results chart
  const transactionData = Object.entries(result.transaction_results).map(([id, data]) => ({
    name: id,
    rc: data.replacement_cost,
    pfe: data.potential_future_exposure,
    ead: data.exposure_at_default,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Replacement Cost (RC)</CardTitle>
            <CardDescription>
              Current exposure to counterparty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ${result.replacement_cost.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on current market values
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Potential Future Exposure (PFE)</CardTitle>
            <CardDescription>
              Potential increase in exposure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ${result.potential_future_exposure.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on SA-CCR methodology
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Exposure at Default (EAD)</CardTitle>
            <CardDescription>
              Total exposure for capital calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ${result.exposure_at_default.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              RC + PFE with alpha factor applied
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="asset-breakdown">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="asset-breakdown">Asset Class Breakdown</TabsTrigger>
          <TabsTrigger value="transaction-details">Transaction Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="asset-breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Asset Class Breakdown</CardTitle>
              <CardDescription>
                Exposure breakdown by asset class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Class</TableHead>
                        <TableHead className="text-right">Exposure</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.asset_class_breakdown.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {formatAssetClass(item.asset_class)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.exposure.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.percentage.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetClassData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetClassData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Exposure']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transaction-details">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Breakdown of exposure by transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead className="text-right">Replacement Cost</TableHead>
                      <TableHead className="text-right">PFE</TableHead>
                      <TableHead className="text-right">EAD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(result.transaction_results).map(([id, data]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell className="text-right">
                          ${data.replacement_cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${data.potential_future_exposure.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${data.exposure_at_default.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={transactionData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                      />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`]} />
                      <Legend />
                      <Bar dataKey="rc" name="Replacement Cost" fill="#0088FE" />
                      <Bar dataKey="pfe" name="Potential Future Exposure" fill="#00C49F" />
                      <Bar dataKey="ead" name="Exposure at Default" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
