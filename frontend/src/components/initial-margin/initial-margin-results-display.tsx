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
  TableFooter,
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
  LineChart,
  Line,
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
  risk_factor_sensitivity?: {
    factor: string;
    sensitivity: number;
  }[];
  margin_profile?: {
    time: number;
    margin: number;
  }[];
  total_gross_margin?: number;
  total_net_margin?: number;
  total_collateral?: number;
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

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const renderCustomizedLabel = ({ name, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Initial Margin Results</h2>
            <p className="text-blue-100">
              Calculation Method: {formatCalculationMethod(result.calculation_method)}
            </p>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-inner">
            <div>
              <p className="text-sm text-blue-100">Total Initial Margin</p>
              <p className="text-3xl font-bold">${formatNumber(result.total_margin)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Class Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle>Asset Class Breakdown</CardTitle>
            <CardDescription className="text-indigo-100">
              Margin allocation by asset class
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetClassData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetClassData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Margin']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {assetClassData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${formatNumber(item.value)}</div>
                    <div className="text-xs text-gray-500">{item.percentage.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Factor Sensitivity */}
        {result.risk_factor_sensitivity && (
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <CardTitle>Risk Factor Sensitivity</CardTitle>
              <CardDescription className="text-cyan-100">
                Impact of risk factors on margin
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.risk_factor_sensitivity}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="factor" type="category" width={100} />
                    <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Sensitivity']} />
                    <Bar dataKey="sensitivity" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                      {result.risk_factor_sensitivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Margin Profile */}
      {result.margin_profile && (
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CardTitle>Margin Profile</CardTitle>
            <CardDescription className="text-emerald-100">
              Margin projection over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={result.margin_profile}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time (days)', position: 'insideBottomRight', offset: -10 }}
                    tickFormatter={(value) => `${value}d`}
                  />
                  <YAxis 
                    label={{ value: 'Margin ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Margin']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Netting Set Results */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <CardTitle>Netting Set Details</CardTitle>
          <CardDescription className="text-amber-100">
            Detailed breakdown by netting set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50">
                  <TableHead className="font-bold">Netting Set</TableHead>
                  <TableHead className="font-bold text-right">Gross Margin</TableHead>
                  <TableHead className="font-bold text-right">Net Margin</TableHead>
                  <TableHead className="font-bold text-right">Collateral</TableHead>
                  <TableHead className="font-bold text-right">Final Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(result.netting_set_results).map(([key, value]: [string, any]) => (
                  <TableRow key={key} className="hover:bg-amber-50 transition-colors">
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="text-right">${formatNumber(value.gross_margin)}</TableCell>
                    <TableCell className="text-right">${formatNumber(value.net_margin)}</TableCell>
                    <TableCell className="text-right">${formatNumber(value.collateral)}</TableCell>
                    <TableCell className="text-right font-bold">${formatNumber(value.final_margin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-amber-100">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">${formatNumber(result.total_gross_margin || 0)}</TableCell>
                  <TableCell className="text-right font-bold">${formatNumber(result.total_net_margin || 0)}</TableCell>
                  <TableCell className="text-right font-bold">${formatNumber(result.total_collateral || 0)}</TableCell>
                  <TableCell className="text-right font-bold">${formatNumber(result.total_margin)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
