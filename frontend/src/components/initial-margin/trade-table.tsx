"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Define the schema for a trade
const tradeSchema = z.object({
  asset_class: z.enum(["interest_rate", "credit", "equity", "commodity", "fx"], {
    required_error: "Please select an asset class.",
  }),
  product: z.enum(["swap", "forward", "option", "swaption", "futures", "other"], {
    required_error: "Please select a product type.",
  }),
  notional: z.coerce.number().positive("Notional must be positive."),
  maturity: z.coerce.number().positive("Maturity must be positive."),
  market_value: z.coerce.number(),
  delta: z.coerce.number().optional(),
  vega: z.coerce.number().optional(),
  curvature: z.coerce.number().optional(),
});

type Trade = z.infer<typeof tradeSchema> & { id: string };

interface TradeTableProps {
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  calculationMethod: string;
}

export function TradeTable({ trades, setTrades, calculationMethod }: TradeTableProps) {
  const [open, setOpen] = useState(false);
  const isSimm = calculationMethod === "simm";

  // Initialize the form
  const form = useForm<z.infer<typeof tradeSchema>>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      asset_class: "interest_rate",
      product: "swap",
      notional: 1000000,
      maturity: 5,
      market_value: 0,
      delta: isSimm ? 1 : undefined,
      vega: isSimm ? 0 : undefined,
      curvature: isSimm ? 0 : undefined,
    },
  });

  // Update form defaults when calculation method changes
  React.useEffect(() => {
    if (isSimm) {
      form.setValue("delta", 1);
      form.setValue("vega", 0);
      form.setValue("curvature", 0);
    }
  }, [calculationMethod, form, isSimm]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof tradeSchema>) => {
    const newTrade = {
      id: uuidv4(),
      ...values,
    };

    setTrades([...trades, newTrade]);
    setOpen(false);
    form.reset();

    toast({
      title: "Trade added",
      description: `Added ${values.product} trade with notional ${values.notional.toLocaleString()}.`,
    });
  };

  // Handle trade deletion
  const handleDelete = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    
    toast({
      title: "Trade removed",
      description: "Trade has been removed from the netting set.",
    });
  };

  // Calculate total notional
  const totalNotional = trades.reduce((sum, t) => sum + t.notional, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Total Notional: ${totalNotional.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Total trades: {trades.length}</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Trade</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Trade</DialogTitle>
              <DialogDescription>
                Add a new trade to the netting set for Initial Margin calculation.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notional</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
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
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="market_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isSimm && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="delta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delta</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="vega"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vega</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="curvature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Curvature</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For SIMM calculation, sensitivity values are required.
                      Delta is typically 1 for linear products and between 0-1 for options.
                      Vega and curvature are typically non-zero only for options.
                    </p>
                  </>
                )}
                
                <DialogFooter>
                  <Button type="submit">Add Trade</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {trades.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Class</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Maturity (years)</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                {isSimm && (
                  <>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right">Vega</TableHead>
                    <TableHead className="text-right">Curvature</TableHead>
                  </>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="capitalize">{trade.asset_class.replace('_', ' ')}</TableCell>
                  <TableCell className="capitalize">{trade.product}</TableCell>
                  <TableCell className="text-right">${trade.notional.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{trade.maturity}</TableCell>
                  <TableCell className="text-right">${trade.market_value.toLocaleString()}</TableCell>
                  {isSimm && (
                    <>
                      <TableCell className="text-right">{trade.delta}</TableCell>
                      <TableCell className="text-right">{trade.vega}</TableCell>
                      <TableCell className="text-right">{trade.curvature}</TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
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
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/50">
          <p className="text-muted-foreground mb-4">No trades added yet.</p>
          <Button 
            variant="outline" 
            onClick={() => setOpen(true)}
          >
            Add Your First Trade
          </Button>
        </div>
      )}
    </div>
  );
}
