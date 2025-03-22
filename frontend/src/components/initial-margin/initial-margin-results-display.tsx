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
import { Badge } from "@/components/ui/badge";
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

// Define the Initial Margin result type
type InitialMarginResult = {
  total_margin: number;
  calculation_method: string;
  asset_class_breakdown: {
    asset_class: string;
    margin: number;
    percentage: number;
  }[];
  sensitivity_breakdown?: {
    delta: number;
    vega: number;
    curvature: number;
  };
  netting_set_results: Record<string, any>;
};

interface InitialMarginResultsDisplayProps {
  result: InitialMarginResult;
}

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function InitialMarginResultsDisplay({ result }: InitialMarginResultsDisplayProps) {
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
    value: item.margin,
    percentage: item.percentage,
  }));

  // Prepare data for the sensitivity breakdown chart (if SIMM)
  const sensitivityData = result.sensitivity_breakdown
    ? [
        { name: 'Delta', value: result.sensitivity_breakdown.delta },
        { name: 'Vega', value: result.sensitivity_breakdown.vega },
        { name: 'Curvature', value: result.sensitivity_breakdown.curvature },
      ]
    : [];

  // Format calculation method for display
  const formatCalculationMethod = (method: string) => {
    if (method === 'grid') {
      return 'Grid/Schedule Approach (BCBS-IOSCO)';
    } else if (method === 'simm') {
      return 'ISDA SIMM (Model-Based Approach)';
    }
    return method;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Initial Margin Results</h2>
          <p className="text-muted-foreground">
            Calculation Method: {formatCalculationMethod(result.calculation_method)}
          </p>
        </div>
        <div className="flex items-center bg-primary/10 p-4 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Initial Margin</p>
            <p className="text-3xl font-bold text-primary">
              ${result.total_margin.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="asset-breakdown">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="asset-breakdown">Asset Class Breakdown</TabsTrigger>
          {result.calculation_method === 'simm' && (
            <TabsTrigger value="sensitivity-breakdown">Sensitivity Breakdown</TabsTrigger>
          )}
          {result.calculation_method !== 'simm' && (
            <TabsTrigger value="netting-sets">Netting Sets</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="asset-breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Asset Class Breakdown</CardTitle>
              <CardDescription>
                Initial margin breakdown by asset class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Class</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
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
                            ${item.margin.toLocaleString()}
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
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Margin']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {result.calculation_method === 'simm' && (
          <TabsContent value="sensitivity-breakdown">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Breakdown</CardTitle>
                <CardDescription>
                  SIMM margin breakdown by risk sensitivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Risk Sensitivity</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sensitivityData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.value.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-6 p-4 bg-muted rounded-md">
                      <h4 className="font-medium mb-2">Risk Sensitivity Explanation</h4>
                      <ul className="space-y-2 text-sm">
                        <li><strong>Delta:</strong> Sensitivity to changes in the underlying price</li>
                        <li><strong>Vega:</strong> Sensitivity to changes in volatility</li>
                        <li><strong>Curvature:</strong> Sensitivity to large price movements (convexity)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sensitivityData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`]} />
                        <Legend />
                        <Bar dataKey="value" name="Margin" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {result.calculation_method !== 'simm' && (
          <TabsContent value="netting-sets">
            <Card>
              <CardHeader>
                <CardTitle>Netting Set Details</CardTitle>
                <CardDescription>
                  Breakdown of margin by netting set
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Netting Set ID</TableHead>
                      <TableHead className="text-right">Number of Trades</TableHead>
                      <TableHead className="text-right">Total Notional</TableHead>
                      <TableHead className="text-right">Initial Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(result.netting_set_results).map(([id, data]: [string, any]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell className="text-right">{data.trade_count || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          ${data.total_notional ? data.total_notional.toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          ${data.margin ? data.margin.toLocaleString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Grid Approach Explanation</h4>
                  <p className="text-sm">
                    The Grid/Schedule Approach applies standardized margin percentages to notional 
                    amounts based on asset class and maturity. This is a simplified approach defined 
                    in the BCBS-IOSCO framework for non-cleared derivatives.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
