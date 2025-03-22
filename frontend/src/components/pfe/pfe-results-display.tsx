import * as React from "react";
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
import { Separator } from "@/components/ui/separator";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Define the PFE result type
type PFEResult = {
  total_exposure: number;
  calculation_method: string;
  confidence_level: string;
  time_horizon: string;
  asset_class_breakdown: {
    asset_class: string;
    exposure: number;
    percentage: number;
  }[];
  exposure_profile: {
    time: number;
    exposure: number;
  }[];
  risk_factor_sensitivity: {
    factor: string;
    sensitivity: number;
  }[];
  netting_set_results: Record<string, any>;
};

type PFEResultsDisplayProps = {
  result: PFEResult;
};

// Define colors for the charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Format number with commas and 2 decimal places
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Format percentage
const formatPercentage = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "percent",
  }).format(num / 100);
};

// Map calculation method to display name
const getMethodDisplayName = (method: string) => {
  switch (method) {
    case "sa_ccr":
      return "SA-CCR";
    case "internal_model":
      return "Internal Model";
    case "historical":
      return "Historical";
    default:
      return method;
  }
};

// Map time horizon to display name
const getTimeHorizonDisplayName = (horizon: string) => {
  switch (horizon) {
    case "1d":
      return "1 Day";
    case "10d":
      return "10 Days";
    case "1m":
      return "1 Month";
    case "3m":
      return "3 Months";
    default:
      return horizon;
  }
};

export function PFEResultsDisplay({ result }: PFEResultsDisplayProps) {
  // Prepare data for the pie chart
  const pieData = result.asset_class_breakdown.map((item) => ({
    name: item.asset_class.replace("_", " ").toUpperCase(),
    value: item.exposure,
  }));

  // Prepare data for the exposure profile chart
  const exposureProfileData = result.exposure_profile.map((item) => ({
    time: `${item.time}y`,
    exposure: item.exposure,
  }));

  // Prepare data for the risk factor sensitivity chart
  const sensitivityData = result.risk_factor_sensitivity.map((item) => ({
    factor: item.factor,
    sensitivity: item.sensitivity,
  }));

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Potential Future Exposure Results</h2>
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                Method: {getMethodDisplayName(result.calculation_method)}
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                Confidence: {result.confidence_level}
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                Horizon: {getTimeHorizonDisplayName(result.time_horizon)}
              </div>
            </div>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-inner">
            <div>
              <p className="text-sm text-purple-100">Total PFE</p>
              <p className="text-3xl font-bold">${formatNumber(result.total_exposure)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exposure Profile Chart */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle>Exposure Profile</CardTitle>
            <CardDescription className="text-blue-100">
              PFE projection over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={exposureProfileData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Time Horizon', position: 'insideBottomRight', offset: -10 }}
                  />
                  <YAxis 
                    label={{ value: 'Exposure ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${formatNumber(value)}`}
                  />
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Exposure']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="exposure"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Class Breakdown */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            <CardTitle>Asset Class Breakdown</CardTitle>
            <CardDescription className="text-violet-100">
              Exposure allocation by asset class
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Exposure']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {result.asset_class_breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.asset_class.replace("_", " ").toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${formatNumber(item.exposure)}</div>
                    <div className="text-xs text-gray-500">{formatPercentage(item.percentage)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factor Sensitivity */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          <CardTitle>Risk Factor Sensitivity</CardTitle>
          <CardDescription className="text-cyan-100">
            Impact of risk factors on exposure
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sensitivityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="factor" type="category" width={100} />
                <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Sensitivity']} />
                <Bar dataKey="sensitivity" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {sensitivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Netting Set Results */}
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardTitle>Netting Set Details</CardTitle>
          <CardDescription className="text-emerald-100">
            Detailed breakdown by netting set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50">
                  <TableHead className="font-bold">Netting Set</TableHead>
                  <TableHead className="font-bold text-right">Trade Count</TableHead>
                  <TableHead className="font-bold text-right">Gross Exposure</TableHead>
                  <TableHead className="font-bold text-right">Net Exposure</TableHead>
                  <TableHead className="font-bold text-right">Final PFE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(result.netting_set_results).map(([key, value]: [string, any]) => (
                  <TableRow key={key} className="hover:bg-emerald-50 transition-colors">
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell className="text-right">{value.trade_count || 'N/A'}</TableCell>
                    <TableCell className="text-right">${formatNumber(value.gross_exposure || 0)}</TableCell>
                    <TableCell className="text-right">${formatNumber(value.net_exposure || 0)}</TableCell>
                    <TableCell className="text-right font-bold">${formatNumber(value.final_exposure || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
