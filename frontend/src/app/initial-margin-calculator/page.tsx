"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TradeTable } from "@/components/initial-margin/trade-table";
import { InitialMarginResultsDisplay } from "@/components/initial-margin/initial-margin-results-display";
import { API_URL } from "@/config/constants";

// Define the schema for the netting set form
const nettingSetSchema = z.object({
  id: z.string().min(1, "Netting set ID is required"),
  calculation_method: z.enum(["grid", "simm"], {
    required_error: "Please select a calculation method.",
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
  delta: z.number().optional(),
  vega: z.number().optional(),
  curvature: z.number().optional(),
});

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

export default function InitialMarginCalculator() {
  const [activeTab, setActiveTab] = useState("manual");
  const [trades, setTrades] = useState<z.infer<typeof tradeSchema>[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<InitialMarginResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Initialize the netting set form
  const nettingSetForm = useForm<z.infer<typeof nettingSetSchema>>({
    resolver: zodResolver(nettingSetSchema),
    defaultValues: {
      id: "NS001",
      calculation_method: "grid",
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
      };

      // Make the API call
      const response = await axios.post(`${API_URL}/api/v1/initial-margin/calculate-public`, payload);
      setResult(response.data);
      setActiveTab("results");

      toast({
        title: "Calculation complete",
        description: "Initial Margin calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating Initial Margin:", error);
      toast({
        title: "Calculation failed",
        description: "There was an error calculating Initial Margin. Please try again.",
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

    const calculationMethod = nettingSetForm.getValues("calculation_method");
    setIsCalculating(true);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("calculation_method", calculationMethod);

      // Make the API call
      const response = await axios.post(
        `${API_URL}/api/v1/initial-margin/calculate-batch-public`,
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
        description: "Batch Initial Margin calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating batch Initial Margin:", error);
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
      <h1 className="text-3xl font-bold mb-6">Initial Margin Calculator</h1>
      
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
                <CardTitle>Calculation Settings</CardTitle>
                <CardDescription>
                  Configure the Initial Margin calculation.
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
                            <Input placeholder="e.g., NS001" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for the netting set.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={nettingSetForm.control}
                      name="calculation_method"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Calculation Method</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="grid" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Grid/Schedule Approach (BCBS-IOSCO)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="simm" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  ISDA SIMM (Model-Based Approach)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            Select the methodology for calculating Initial Margin.
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
                        "Calculate Initial Margin"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trades</CardTitle>
                <CardDescription>
                  Add trades to the netting set.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradeTable 
                  trades={trades} 
                  setTrades={setTrades} 
                  calculationMethod={nettingSetForm.watch("calculation_method")}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>Batch Calculation via CSV Upload</CardTitle>
              <CardDescription>
                Upload a CSV file containing multiple trades for batch Initial Margin calculation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <FormField
                  control={nettingSetForm.control}
                  name="calculation_method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Calculation Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="grid" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Grid/Schedule Approach (BCBS-IOSCO)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="simm" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              ISDA SIMM (Model-Based Approach)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Select the methodology for calculating Initial Margin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-4" />
                
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Drag and drop your CSV file here, or click to browse.
                    <br />
                    The CSV should contain columns for trade ID, asset class, product, notional, maturity, and market value.
                  </p>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                    className="max-w-sm"
                  />
                </div>
                
                {csvFile && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{csvFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(csvFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button 
                      onClick={onCsvSubmit}
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process File"
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="bg-muted p-4 rounded-md">
                  <h4 className="font-medium mb-2">CSV Format Example</h4>
                  <pre className="text-xs overflow-x-auto">
                    netting_set_id,id,asset_class,product,notional,maturity,market_value,delta,vega,curvature<br />
                    NS001,T001,interest_rate,swap,1000000,5,10000,1,0,0<br />
                    NS001,T002,equity,option,500000,1,-5000,0.5,0.1,0.01<br />
                    NS001,T003,fx,forward,750000,0.5,2500,1,0,0
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          {result && <InitialMarginResultsDisplay result={result} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
