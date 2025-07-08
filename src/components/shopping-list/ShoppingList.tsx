'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { markItemAsBought, deleteShoppingListItem } from '@/app/shopping-list/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShoppingListItem } from '@/app/page';


interface ShoppingListProps {
  items: ShoppingListItem[];
}

export function ShoppingList({ items }: ShoppingListProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleMarkAsBought = (id: number) => {
    startTransition(async () => {
      const result = await markItemAsBought(id);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success!', description: result.message });
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const result = await deleteShoppingListItem(id);
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success!', description: result.message });
      }
    });
  };

  return (
    <Card className="mb-8 shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">My Shopping List</CardTitle>
        <CardDescription>Check items off to move them to your expense tracker.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-2 -ml-2 rounded-lg transition-colors hover:bg-muted/50">
              <Checkbox
                id={`item-${item.id}`}
                onCheckedChange={() => handleMarkAsBought(item.id)}
                disabled={isPending}
                aria-label={`Mark ${item.product_name} as bought`}
                className="h-5 w-5"
              />
              <Image src={item.image_url} alt={item.product_name} width={48} height={48} className="rounded-md object-cover" data-ai-hint="product image" />
              <div className="flex-grow">
                <div className="font-semibold text-foreground">{item.product_name} {item.quantity > 1 && <span className="text-muted-foreground font-normal text-sm">(x{item.quantity})</span>}</div>
                <div className="text-sm text-muted-foreground">from {item.vendor_name}</div>
              </div>
              <div className="font-bold text-lg text-primary">${(item.price * item.quantity).toFixed(2)}</div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleDelete(item.id)} disabled={isPending} aria-label="Delete item">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
