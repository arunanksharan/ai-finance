"use client";

import * as React from "react";
import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TradeTable } from "@/components/pfe/trade-table";
import { PFEResultsDisplay } from "@/components/pfe/pfe-results-display";

// Define the API URL (this would typically be imported from a constants file)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Define the schema for the netting set form
const nettingSetSchema = z.object({
  id: z.string().min(1, "Netting set ID is required"),
  calculation_method: z.enum(["sa_ccr", "internal_model", "historical"], {
    required_error: "Please select a calculation method.",
  }),
  confidence_level: z.enum(["90", "95", "97.5", "99"], {
    required_error: "Please select a confidence level.",
  }),
  time_horizon: z.enum(["1d", "10d", "1m", "3m"], {
    required_error: "Please select a time horizon.",
  }),
});

// Define the schema for the trade
const tradeSchema = z.object({
  id: z.string(),
  asset_class: z.enum(["interest_rate", "credit", "equity", "commodity", "fx"]),
  product: z.enum(["swap", "forward", "option", "swaption", "futures", "other"]),
  notional: z.number().positive(),
  maturity: z.number().positive(),
  market_value: z.number(),
  volatility: z.number().positive().optional(),
  underlying_price: z.number().positive().optional(),
  strike: z.number().positive().optional(),
});

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

export default function PFECalculator() {
  const [activeTab, setActiveTab] = React.useState("manual");
  const [trades, setTrades] = React.useState<z.infer<typeof tradeSchema>[]>([]);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [result, setResult] = React.useState<PFEResult | null>(null);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);

  // Initialize the netting set form
  const nettingSetForm = useForm<z.infer<typeof nettingSetSchema>>({
    resolver: zodResolver(nettingSetSchema),
    defaultValues: {
      id: "NS001",
      calculation_method: "sa_ccr",
      confidence_level: "95",
      time_horizon: "10d",
    },
  });

  // Handle manual form submission
  const onManualSubmit = async (values: z.infer<typeof nettingSetSchema>) => {
    if (trades.length === 0) {
      toast({
        title: "No trades",
        description: "Please add at least one trade to the netting set.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setResult(null);

    try {
      // Prepare the request payload
      const payload = {
        netting_sets: [
          {
            id: values.id,
            trades: trades,
          }
        ],
        calculation_method: values.calculation_method,
        confidence_level: values.confidence_level,
        time_horizon: values.time_horizon,
      };

      // Make the API call
      const response = await axios.post(`${API_URL}/api/v1/pfe/calculate-public`, payload);
      setResult(response.data);
      setActiveTab("results");

      toast({
        title: "Calculation complete",
        description: "PFE calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating PFE:", error);
      toast({
        title: "Calculation failed",
        description: "There was an error calculating PFE. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  // Handle CSV form submission
  const onCsvSubmit = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    const values = nettingSetForm.getValues();
    setIsCalculating(true);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("calculation_method", values.calculation_method);
      formData.append("confidence_level", values.confidence_level);
      formData.append("time_horizon", values.time_horizon);

      // Make the API call
      const response = await axios.post(
        `${API_URL}/api/v1/pfe/calculate-batch-public`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);
      setActiveTab("results");

      toast({
        title: "Calculation complete",
        description: "Batch PFE calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating batch PFE:", error);
      toast({
        title: "Calculation failed",
        description: "There was an error processing your CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Potential Future Exposure (PFE) Calculator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Netting Set Parameters</CardTitle>
                <CardDescription>
                  Configure the parameters for your PFE calculation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...nettingSetForm}>
                  <form onSubmit={nettingSetForm.handleSubmit(onManualSubmit)} className="space-y-6">
                    <FormField
                      control={nettingSetForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Netting Set ID</FormLabel>
                          <FormControl>
                            <Input placeholder="NS001" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for this netting set.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nettingSetForm.control}
                      name="calculation_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calculation Method</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a calculation method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sa_ccr">SA-CCR</SelectItem>
                              <SelectItem value="internal_model">Internal Model</SelectItem>
                              <SelectItem value="historical">Historical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The methodology used to calculate PFE.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nettingSetForm.control}
                      name="confidence_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confidence Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a confidence level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="90">90%</SelectItem>
                              <SelectItem value="95">95%</SelectItem>
                              <SelectItem value="97.5">97.5%</SelectItem>
                              <SelectItem value="99">99%</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The statistical confidence level for the PFE calculation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nettingSetForm.control}
                      name="time_horizon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Horizon</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a time horizon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1d">1 Day</SelectItem>
                              <SelectItem value="10d">10 Days</SelectItem>
                              <SelectItem value="1m">1 Month</SelectItem>
                              <SelectItem value="3m">3 Months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The time horizon for the PFE calculation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isCalculating}>
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        "Calculate PFE"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trades</CardTitle>
                  <CardDescription>
                    Add trades to your netting set for PFE calculation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TradeTable trades={trades} setTrades={setTrades} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>Batch Calculation</CardTitle>
              <CardDescription>
                Upload a CSV file containing multiple trades for batch PFE calculation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...nettingSetForm}>
                <div className="space-y-6">
                  <FormField
                    control={nettingSetForm.control}
                    name="calculation_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calculation Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a calculation method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sa_ccr">SA-CCR</SelectItem>
                            <SelectItem value="internal_model">Internal Model</SelectItem>
                            <SelectItem value="historical">Historical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The methodology used to calculate PFE.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={nettingSetForm.control}
                    name="confidence_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confidence Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a confidence level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="95">95%</SelectItem>
                            <SelectItem value="97.5">97.5%</SelectItem>
                            <SelectItem value="99">99%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The statistical confidence level for the PFE calculation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={nettingSetForm.control}
                    name="time_horizon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Horizon</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time horizon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1d">1 Day</SelectItem>
                            <SelectItem value="10d">10 Days</SelectItem>
                            <SelectItem value="1m">1 Month</SelectItem>
                            <SelectItem value="3m">3 Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The time horizon for the PFE calculation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <label htmlFor="csv-upload" className="text-sm font-medium">
                      CSV File
                    </label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with trade data.
                    </p>
                  </div>
                  
                  <Button onClick={onCsvSubmit} disabled={isCalculating || !csvFile}>
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload and Calculate
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          {result && <PFEResultsDisplay result={result} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
