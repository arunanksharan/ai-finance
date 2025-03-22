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
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TransactionTable } from "@/components/saccr/transaction-table";
import { SACCRResultsDisplay } from "@/components/saccr/saccr-results-display";
import { API_URL } from "@/config/constants";

// Define the schema for the netting set form
const nettingSetSchema = z.object({
  id: z.string().min(1, "Netting set ID is required"),
  counterparty: z.string().min(1, "Counterparty name is required"),
});

// Define the schema for the transaction
const transactionSchema = z.object({
  id: z.string(),
  asset_class: z.enum(["interest_rate", "credit", "equity", "commodity", "fx"]),
  transaction_type: z.enum(["swap", "forward", "option", "swaption", "futures", "other"]),
  notional: z.number().positive(),
  maturity: z.number().positive(),
  market_value: z.number(),
  collateral: z.number().default(0),
});

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

export default function SACCRCalculator() {
  const [activeTab, setActiveTab] = useState("manual");
  const [transactions, setTransactions] = useState<z.infer<typeof transactionSchema>[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<SACCRResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Initialize the netting set form
  const nettingSetForm = useForm<z.infer<typeof nettingSetSchema>>({
    resolver: zodResolver(nettingSetSchema),
    defaultValues: {
      id: "NS001",
      counterparty: "Bank ABC",
    },
  });

  // Handle manual form submission
  const onManualSubmit = async (values: z.infer<typeof nettingSetSchema>) => {
    if (transactions.length === 0) {
      toast({
        title: "No transactions",
        description: "Please add at least one transaction to the netting set.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    setResult(null);

    try {
      // Prepare the request payload
      const payload = {
        netting_set: {
          id: values.id,
          counterparty: values.counterparty,
          transactions: transactions,
        },
      };

      // Make the API call
      const response = await axios.post(`${API_URL}/api/v1/saccr/calculate-public`, payload);
      setResult(response.data);

      toast({
        title: "Calculation complete",
        description: "SACCR calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating SACCR:", error);
      toast({
        title: "Calculation failed",
        description: "There was an error calculating SACCR. Please try again.",
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

    setIsCalculating(true);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", csvFile);

      // Make the API call
      const response = await axios.post(
        `${API_URL}/api/v1/saccr/calculate-batch-public`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);

      toast({
        title: "Calculation complete",
        description: "Batch SACCR calculation has been completed successfully.",
      });
    } catch (error) {
      console.error("Error calculating batch SACCR:", error);
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
      <h1 className="text-3xl font-bold mb-6">SA-CCR Calculator</h1>
      
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
                <CardTitle>Netting Set Information</CardTitle>
                <CardDescription>
                  Enter the details of the netting set.
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
                      name="counterparty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Counterparty</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Bank ABC" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of the counterparty.
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
                        "Calculate SACCR"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  Add transactions to the netting set.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionTable 
                  transactions={transactions} 
                  setTransactions={setTransactions} 
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
                Upload a CSV file containing multiple transactions for batch SACCR calculation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Drag and drop your CSV file here, or click to browse.
                    <br />
                    The CSV should contain columns for transaction ID, asset class, type, notional, maturity, and market value.
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
                    id,asset_class,transaction_type,notional,maturity,market_value,collateral<br />
                    T001,interest_rate,swap,1000000,5,10000,0<br />
                    T002,equity,option,500000,1,-5000,0<br />
                    T003,fx,forward,750000,0.5,2500,0
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          {result && <SACCRResultsDisplay result={result} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
