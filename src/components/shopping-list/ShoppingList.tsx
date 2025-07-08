'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown } from 'lucide-react';
import { useTransition, useState, useMemo } from 'react';
import { markItemAsBought, deleteShoppingListItem } from '@/app/shopping-list/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ShoppingListItem } from '@/app/page';

interface ShoppingListProps {
  items: ShoppingListItem[];
}

export function ShoppingList({ items }: ShoppingListProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

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
    <Card className="mb-8 shadow-lg border-primary/20 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-0 block text-left">
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
              <div>
                <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                  My Shopping List
                  <span className="text-base font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Total Estimate: <span className="font-semibold text-primary">${total.toFixed(2)}</span>
                </CardDescription>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 p-2 -ml-2 rounded-lg transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    onCheckedChange={() => handleMarkAsBought(item.id)}
                    disabled={isPending}
                    aria-label={`Mark ${item.product_name} as bought`}
                    className="h-5 w-5"
                  />
                  <Image
                    src={item.image_url}
                    alt={item.product_name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                    data-ai-hint="product image"
                  />
                  <div className="flex-grow">
                    <div className="font-semibold text-foreground">
                      {item.product_name}{' '}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground font-normal text-sm">
                          (x{item.quantity})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      from {item.vendor_name}
                    </div>
                  </div>
                  <div className="font-bold text-lg text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
