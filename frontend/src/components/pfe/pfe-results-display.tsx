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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total PFE
            </CardTitle>
            <CardDescription>
              {getMethodDisplayName(result.calculation_method)} Method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(result.total_exposure)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {result.confidence_level}% confidence, {getTimeHorizonDisplayName(result.time_horizon)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="exposure-profile">Exposure Profile</TabsTrigger>
          <TabsTrigger value="asset-breakdown">Asset Breakdown</TabsTrigger>
          <TabsTrigger value="sensitivity">Risk Sensitivity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PFE Summary</CardTitle>
              <CardDescription>
                Overview of the Potential Future Exposure calculation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Parameters</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calculation Method:</span>
                      <span className="font-medium">{getMethodDisplayName(result.calculation_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence Level:</span>
                      <span className="font-medium">{result.confidence_level}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time Horizon:</span>
                      <span className="font-medium">{getTimeHorizonDisplayName(result.time_horizon)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Results</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total PFE:</span>
                      <span className="font-medium">${formatNumber(result.total_exposure)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number of Asset Classes:</span>
                      <span className="font-medium">{result.asset_class_breakdown.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Asset Class Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`$${formatNumber(value)}`, "Exposure"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exposure-profile">
          <Card>
            <CardHeader>
              <CardTitle>Exposure Profile</CardTitle>
              <CardDescription>
                PFE exposure profile over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={exposureProfileData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, "Exposure"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="exposure"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="PFE"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asset-breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Asset Class Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of PFE by asset class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.asset_class_breakdown.map(item => ({
                      name: item.asset_class.replace("_", " ").toUpperCase(),
                      exposure: item.exposure,
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, "Exposure"]} />
                    <Legend />
                    <Bar dataKey="exposure" fill="#8884d8" name="PFE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Class</TableHead>
                      <TableHead>Exposure</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.asset_class_breakdown.map((item) => (
                      <TableRow key={item.asset_class}>
                        <TableCell className="font-medium capitalize">
                          {item.asset_class.replace("_", " ")}
                        </TableCell>
                        <TableCell>${formatNumber(item.exposure)}</TableCell>
                        <TableCell>{formatPercentage(item.percentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factor Sensitivity</CardTitle>
              <CardDescription>
                Sensitivity of PFE to different risk factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sensitivityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="factor" type="category" />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)}`, "Sensitivity"]} />
                    <Legend />
                    <Bar dataKey="sensitivity" fill="#82ca9d" name="Sensitivity" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Factor</TableHead>
                      <TableHead>Sensitivity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.risk_factor_sensitivity.map((item) => (
                      <TableRow key={item.factor}>
                        <TableCell className="font-medium">
                          {item.factor}
                        </TableCell>
                        <TableCell>{formatNumber(item.sensitivity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
