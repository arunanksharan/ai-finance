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

// Define the schema for a transaction
const transactionSchema = z.object({
  asset_class: z.enum(["interest_rate", "credit", "equity", "commodity", "fx"], {
    required_error: "Please select an asset class.",
  }),
  transaction_type: z.enum(["swap", "forward", "option", "swaption", "futures", "other"], {
    required_error: "Please select a transaction type.",
  }),
  notional: z.coerce.number().positive("Notional must be positive."),
  maturity: z.coerce.number().positive("Maturity must be positive."),
  market_value: z.coerce.number(),
  collateral: z.coerce.number().default(0),
});

type Transaction = z.infer<typeof transactionSchema> & { id: string };

interface TransactionTableProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export function TransactionTable({ transactions, setTransactions }: TransactionTableProps) {
  const [open, setOpen] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      asset_class: "interest_rate",
      transaction_type: "swap",
      notional: 1000000,
      maturity: 5,
      market_value: 0,
      collateral: 0,
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    const newTransaction = {
      id: uuidv4(),
      ...values,
    };

    setTransactions([...transactions, newTransaction]);
    setOpen(false);
    form.reset();

    toast({
      title: "Transaction added",
      description: `Added ${values.transaction_type} transaction with notional ${values.notional.toLocaleString()}.`,
    });
  };

  // Handle transaction deletion
  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    
    toast({
      title: "Transaction removed",
      description: "Transaction has been removed from the netting set.",
    });
  };

  // Calculate total notional
  const totalNotional = transactions.reduce((sum, t) => sum + t.notional, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Total Notional: ${totalNotional.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Total transactions: {transactions.length}</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Transaction</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
              <DialogDescription>
                Add a new transaction to the netting set for SACCR calculation.
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
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a transaction type" />
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
                
                <div className="grid grid-cols-2 gap-4">
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
                  
                  <FormField
                    control={form.control}
                    name="collateral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collateral</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Add Transaction</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {transactions.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Maturity (years)</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Collateral</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="capitalize">{transaction.asset_class.replace('_', ' ')}</TableCell>
                  <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                  <TableCell className="text-right">${transaction.notional.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{transaction.maturity}</TableCell>
                  <TableCell className="text-right">${transaction.market_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${transaction.collateral.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
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
          <p className="text-muted-foreground mb-4">No transactions added yet.</p>
          <Button 
            variant="outline" 
            onClick={() => setOpen(true)}
          >
            Add Your First Transaction
          </Button>
        </div>
      )}
    </div>
  );
}
