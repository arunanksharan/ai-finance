import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

// Define the schema for the trade
const tradeSchema = z.object({
  id: z.string().default(() => `T${Math.floor(Math.random() * 10000)}`),
  asset_class: z.enum(["interest_rate", "credit", "equity", "commodity", "fx"], {
    required_error: "Please select an asset class.",
  }),
  product: z.enum(["swap", "forward", "option", "swaption", "futures", "other"], {
    required_error: "Please select a product type.",
  }),
  notional: z.coerce.number().positive({
    message: "Notional must be a positive number.",
  }),
  maturity: z.coerce.number().positive({
    message: "Maturity must be a positive number.",
  }),
  market_value: z.coerce.number({
    required_error: "Please enter a market value.",
  }),
  volatility: z.coerce.number().positive({
    message: "Volatility must be a positive number.",
  }).optional(),
  underlying_price: z.coerce.number().positive({
    message: "Underlying price must be a positive number.",
  }).optional(),
  strike: z.coerce.number().positive({
    message: "Strike price must be a positive number.",
  }).optional(),
});

type TradeTableProps = {
  trades: z.infer<typeof tradeSchema>[];
  setTrades: React.Dispatch<React.SetStateAction<z.infer<typeof tradeSchema>[]>>;
};

export function TradeTable({ trades, setTrades }: TradeTableProps) {
  const [isOptionFields, setIsOptionFields] = React.useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof tradeSchema>>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      asset_class: "interest_rate",
      product: "swap",
      notional: 1000000,
      maturity: 5,
      market_value: 0,
    },
  });

  // Watch the product field to show/hide option-specific fields
  const productType = form.watch("product");
  
  // Update option fields visibility when product type changes
  React.useEffect(() => {
    setIsOptionFields(productType === "option" || productType === "swaption");
  }, [productType]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof tradeSchema>) => {
    setTrades([...trades, values]);
    form.reset({
      id: `T${Math.floor(Math.random() * 10000)}`,
      asset_class: "interest_rate",
      product: "swap",
      notional: 1000000,
      maturity: 5,
      market_value: 0,
    });
  };

  // Handle trade deletion
  const handleDelete = (id: string) => {
    setTrades(trades.filter((trade) => trade.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="asset_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Class</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an asset class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="interest_rate">Interest Rate</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="commodity">Commodity</SelectItem>
                          <SelectItem value="fx">FX</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="swap">Swap</SelectItem>
                          <SelectItem value="forward">Forward</SelectItem>
                          <SelectItem value="option">Option</SelectItem>
                          <SelectItem value="swaption">Swaption</SelectItem>
                          <SelectItem value="futures">Futures</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notional</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maturity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maturity (years)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="market_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isOptionFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="volatility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volatility (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="underlying_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Underlying Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="strike"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strike Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
              
              <Button type="submit" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Trade
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {trades.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Asset Class</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Notional</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Market Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{trade.id}</TableCell>
                  <TableCell className="capitalize">
                    {trade.asset_class.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="capitalize">
                    {trade.product}
                  </TableCell>
                  <TableCell>{trade.notional.toLocaleString()}</TableCell>
                  <TableCell>{trade.maturity} years</TableCell>
                  <TableCell>{trade.market_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(trade.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
