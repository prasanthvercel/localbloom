'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Save, Pencil, XCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { updateExpense } from '@/app/calculator/actions';


const expenseSchema = z.object({
  itemName: z.string().min(2, { message: 'Item name must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be a positive number.' }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

type Expense = {
  id?: number;
  item_name: string;
  amount: number;
  expense_date?: string;
};

interface ExpenseTrackerProps {
  user: User;
  initialExpenses: Expense[];
}

export function ExpenseTracker({ user, initialExpenses }: ExpenseTrackerProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [items, setItems] = useState<Expense[]>(initialExpenses);
  const [newItems, setNewItems] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedItemName, setEditedItemName] = useState('');
  const [editedAmount, setEditedAmount] = useState<number | string>('');

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      itemName: '',
      amount: '',
    },
  });

  const onAddItem = (values: ExpenseFormValues) => {
    const newItem: Expense = {
      item_name: values.itemName,
      amount: values.amount,
      expense_date: format(new Date(), 'yyyy-MM-dd'),
    };
    setNewItems((prev) => [...prev, newItem]);
    form.reset();
  };

  const onRemoveNewItem = (index: number) => {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  };
  
  const onRemoveExistingItem = async (itemId: number) => {
    const originalItems = [...items];
    setItems(prev => prev.filter(item => item.id !== itemId));

    const { error } = await supabase.from('expenses').delete().match({ id: itemId });

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete expense. Please try again.', variant: 'destructive' });
      setItems(originalItems);
    } else {
      toast({ title: 'Success', description: 'Expense deleted.' });
    }
  };

  const onSaveExpenses = async () => {
    if (newItems.length === 0) {
      toast({ title: 'No new items to save', description: 'Add some expenses first.' });
      return;
    }
    setIsLoading(true);

    const expensesToInsert = newItems.map(item => ({
        user_id: user.id,
        item_name: item.item_name,
        amount: item.amount,
        expense_date: item.expense_date
    }));

    const { data, error } = await supabase.from('expenses').insert(expensesToInsert).select();

    if (error) {
      toast({ title: 'Error', description: 'Failed to save expenses. Please try again.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Your expenses have been saved.' });
      // Add new saved items to the main list and clear the new items list
      setItems(prev => [...data, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setNewItems([]);
    }
    setIsLoading(false);
  };
  
  const handleEditClick = (item: Expense) => {
    setEditingId(item.id!);
    setEditedItemName(item.item_name);
    setEditedAmount(item.amount);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedItemName('');
    setEditedAmount('');
  };

  const handleUpdateExpense = async (itemId: number) => {
    const amountNumber = Number(editedAmount);
    if (!editedItemName || isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: 'Invalid Data',
        description: 'Please provide a valid item name and amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await updateExpense(itemId, editedItemName, amountNumber);

    if (result.success && result.updatedExpense) {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, ...result.updatedExpense! } : item
        )
      );
      toast({ title: 'Success', description: 'Expense updated.' });
      handleCancelEdit();
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to update expense.', variant: 'destructive' });
    }
    setIsLoading(false);
  };


  const totalExpenses = useMemo(() => {
    const existingTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const newTotal = newItems.reduce((sum, item) => sum + Number(item.amount), 0);
    return existingTotal + newTotal;
  }, [items, newItems]);

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
          <CardDescription>
            Track your expenses for {currentMonth}. Add items and save them to record your spending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddItem)} className="flex flex-col sm:flex-row items-start gap-4 mb-8 p-4 border rounded-lg bg-muted/50">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem className="flex-grow w-full">
                    <FormLabel>Expense Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Coffee, Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-40">
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="15.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto mt-auto self-end sm:self-center">
                <PlusCircle className="mr-2" /> Add
              </Button>
            </form>
          </Form>

          <h3 className="text-lg font-semibold mb-2">Current Month's Expenses</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newItems.length === 0 && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No expenses added for this month yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {newItems.map((item, index) => (
                      <TableRow key={`new-${index}`} className="bg-primary/10">
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell className="text-right">${Number(item.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => onRemoveNewItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.map((item) =>
                      editingId === item.id ? (
                        <TableRow key={item.id} className="bg-secondary/50">
                          <TableCell>
                            <Input
                              value={editedItemName}
                              onChange={(e) => setEditedItemName(e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                             <Input
                              type="number"
                              value={editedAmount}
                              onChange={(e) => setEditedAmount(e.target.value)}
                              className="h-8 w-24 ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center items-center">
                              <Button variant="ghost" size="icon" onClick={() => handleUpdateExpense(item.id!)} disabled={isLoading}>
                                <Save className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-right">${Number(item.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center">
                             <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onRemoveExistingItem(item.id!)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between bg-muted/50 p-6 rounded-b-lg">
          <div className="text-lg font-bold">
            Total for {currentMonth}: <span className="text-primary">${totalExpenses.toFixed(2)}</span>
          </div>
          <Button onClick={onSaveExpenses} disabled={isLoading || newItems.length === 0} className="w-full sm:w-auto mt-4 sm:mt-0">
            {isLoading && !editingId ? 'Saving...' : <><Save className="mr-2" /> Save New Expenses</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
