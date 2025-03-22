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
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PortfolioTable } from "@/components/var/portfolio-table";
import { VaRResultsDisplay } from "@/components/var/var-results-display";
import { API_URL } from "@/config/constants";

// Define the schema for the form
const formSchema = z.object({
  method: z.enum(["historical", "parametric", "monte_carlo"], {
    required_error: "Please select a calculation method.",
  }),
  confidence_level: z.enum(["90", "95", "97.5", "99"], {
    required_error: "Please select a confidence level.",
  }),
  time_horizon: z.enum(["1d", "10d", "1m", "3m"], {
    required_error: "Please select a time horizon.",
  }),
});

// Define the portfolio position schema
const positionSchema = z.object({
  id: z.string(),
  asset_class: z.enum(["equity", "fx", "interest_rate", "commodity", "crypto"]),
  instrument: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  volatility: z.number().positive(),
});

// Define the VaR result type
type VaRResult = {
  var_value: number;
  confidence_level: string;
  time_horizon: string;
  method: string;
  diversification_benefit: number;
  asset_contributions: {
    asset_class: string;
    contribution: number;
    percentage: number;
  }[];
  stress_scenarios: {
    scenario: string;
    var_value: number;
    change_percentage: number;
  }[];
  return_distribution: {
    mean: number;
    median: number;
    standard_deviation: number;
    skewness: number;
    kurtosis: number;
  };
};

export default function VaRCalculator() {
  const [positions, setPositions] = useState<z.infer<typeof positionSchema>[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<VaRResult | null>(null);
  const [activeTab, setActiveTab] = useState("parameters");

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "historical",
      confidence_level: "95",
      time_horizon: "1d",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (positions.length === 0) {
      toast({
        title: "No positions",
        description: "Please add at least one position to your portfolio.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setResult(null);

    try {
      // Prepare the request payload
      const payload = {
        method: values.method,
        confidence_level: values.confidence_level,
        time_horizon: values.time_horizon,
        positions: positions.map(p => ({
          asset_class: p.asset_class,
          instrument: p.instrument,
          quantity: p.quantity,
          price: p.price,
          volatility: p.volatility,
        })),
      };

      // Make the API call
      const response = await axios.post(`${API_URL}/api/v1/var/calculate-public`, payload);
      setResult(response.data);
      setActiveTab("results");

      toast({
        title: "Calculation complete",
        description: "VaR calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating VaR:", error);
      toast({
        title: "Calculation failed",
        description: "There was an error calculating VaR. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Value at Risk (VaR) Calculator</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parameters">Parameters & Portfolio</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parameters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>VaR Parameters</CardTitle>
                <CardDescription>
                  Set the parameters for your VaR calculation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="method"
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
                              <SelectItem value="historical">Historical Simulation</SelectItem>
                              <SelectItem value="parametric">Parametric</SelectItem>
                              <SelectItem value="monte_carlo">Monte Carlo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The method used to calculate VaR.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
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
                            The confidence level for the VaR calculation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
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
                            The time horizon for the VaR calculation.
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
                        "Calculate VaR"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Positions</CardTitle>
                <CardDescription>
                  Add positions to your portfolio for VaR calculation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioTable 
                  positions={positions} 
                  setPositions={setPositions} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          {result && <VaRResultsDisplay result={result} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
