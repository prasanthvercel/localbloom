
'use client';

import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, CheckCheck } from 'lucide-react';
import { useTransition, useState, useMemo, useEffect } from 'react';
import { moveItemsToExpenses, deleteShoppingListItem, toggleItemBoughtStatus } from '@/app/shopping-list/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ShoppingListItem } from '@/app/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface ShoppingListProps {
  items: ShoppingListItem[];
}

export function ShoppingList({ items }: ShoppingListProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const { boughtTotal, remainingTotal, grandTotal, hasBoughtItems } = useMemo(() => {
    let bought = 0;
    let remaining = 0;
    let anyBought = false;
    
    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (item.bought) {
            bought += itemTotal;
            anyBought = true;
        } else {
            remaining += itemTotal;
        }
    });

    return {
        boughtTotal: bought,
        remainingTotal: remaining,
        grandTotal: bought + remaining,
        hasBoughtItems: anyBought
    };
  }, [items]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
        if (event.target === document && isOpen && window.scrollY > 0) {
            setIsOpen(false);
        }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleToggleBought = (itemId: number, currentStatus: boolean) => {
    startTransition(async () => {
        const result = await toggleItemBoughtStatus(itemId, !currentStatus);
        if (result?.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };

  const handleMoveBoughtItemsToExpenses = () => {
    startTransition(async () => {
      const idsToMove = items.filter(item => item.bought).map(item => item.id);
      if (idsToMove.length === 0) {
        toast({ variant: 'destructive', title: 'No items selected', description: 'Mark items as "bought" first.' });
        return;
      }
      const result = await moveItemsToExpenses(idsToMove);
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
                    <span>Total Estimate: <span className="font-semibold text-primary">${grandTotal.toFixed(2)}</span></span>
                    {grandTotal > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 font-medium">
                            <span className="text-green-600">Bought: ${boughtTotal.toFixed(2)}</span>
                            <span className="mx-2">|</span>
                            <span className="text-yellow-600">To Buy: ${remainingTotal.toFixed(2)}</span>
                        </div>
                    )}
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
             <ScrollArea className="h-72">
                <ul className="space-y-3 pr-4">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 p-2 -ml-2 rounded-lg transition-colors hover:bg-muted/50"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleBought(item.id, item.bought)}
                        disabled={isPending}
                        aria-label={`Mark ${item.product_name} as ${item.bought ? 'to buy' : 'bought'}`}
                        className={cn(
                          'w-24 transition-all',
                          item.bought
                            ? 'bg-green-500 hover:bg-green-600 text-white border-green-600'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-500'
                        )}
                      >
                       {item.bought ? 'Bought' : 'To Buy'}
                      </Button>
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
                          {item.product_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.price.toFixed(2)} from {item.vendor_name}
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
            </ScrollArea>
          </CardContent>
          {items.length > 0 && (
            <>
            <Separator className="my-2" />
            <CardFooter className="pt-4 flex justify-end">
                <Button 
                    onClick={handleMoveBoughtItemsToExpenses} 
                    disabled={isPending || !hasBoughtItems}
                >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Move Bought Items to Expenses
                </Button>
            </CardFooter>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
