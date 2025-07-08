'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/data/vendors';
import { Star, Sparkles, Tag, Store, PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addItemToShoppingList } from '@/app/shopping-list/actions';
import type { User } from '@supabase/supabase-js';

export type ProductWithVendor = Product & {
  vendorId: string;
  vendorName: string;
  vendorRating: number;
};

interface ProductResultCardProps {
  item: ProductWithVendor;
  user: User | null;
}

export function ProductResultCard({ item, user }: ProductResultCardProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    formData.set('quantity', quantity.toString());
    
    const result = await addItemToShoppingList(formData);

    if (result.success) {
      toast({
        title: 'Item Added!',
        description: result.message,
      });
      setOpen(false);
      setQuantity(1);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add item.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };
  
  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  }

  return (
    <>
      <Card className="overflow-hidden h-full group transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
        <div className="flex">
          <Link href={`/vendor/${item.vendorId}`} className="flex flex-grow items-center">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
              <Image 
                src={item.image} 
                alt={item.name} 
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="product image"
              />
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-base sm:text-lg text-foreground pr-4 line-clamp-2">{item.name}</h3>
              
              <div className="flex items-center flex-wrap gap-2 mt-2">
                  {item.lowPrice && (
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10 py-0.5 px-1.5 text-xs w-fit">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Price
                    </Badge>
                  )}
                  {item.discount && (
                    <Badge variant="outline" className="border-accent text-accent bg-accent/10 py-0.5 px-1.5 text-xs w-fit">
                      <Tag className="h-3 w-3 mr-1" />{item.discount}
                    </Badge>
                  )}
              </div>

              <div className="flex-grow" />

              <div className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span className="font-medium">{item.vendorName}</span>
                </div>
                <div className="flex items-center gap-1 text-xs pl-6">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    <span>{item.vendorRating.toFixed(1)} rating</span>
                </div>
              </div>
            </div>
          </Link>

          <div className="p-4 flex flex-col justify-center items-end border-l bg-card flex-shrink-0 w-32 sm:w-40">
            <p className="text-xl sm:text-2xl font-black text-primary mb-2">${item.price.toFixed(2)}</p>
            {user && user.user_metadata?.role === 'customer' && (
              <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setQuantity(1); }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleAddItem}>
                    <DialogHeader>
                      <DialogTitle>Add to Shopping List</DialogTitle>
                      <DialogDescription>
                        Set the quantity for <span className="font-semibold">{item.name}</span>. This will be added to your shopping list on the home page.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                       <input type="hidden" name="productName" value={item.name} />
                       <input type="hidden" name="price" value={item.price.toString()} />
                       <input type="hidden" name="vendorName" value={item.vendorName} />
                       <input type="hidden" name="imageUrl" value={item.image} />

                       <div className="flex items-center justify-center gap-4">
                          <Button type="button" variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                              <MinusCircle className="h-4 w-4" />
                          </Button>
                          <Input
                              name="quantity_display"
                              className="w-20 text-center text-lg font-bold"
                              value={quantity}
                              readOnly
                          />
                          <Button type="button" variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                              <PlusCircle className="h-4 w-4" />
                          </Button>
                       </div>
                       <div className="text-center text-lg">
                          Total: <span className="font-bold text-primary">${(item.price * quantity).toFixed(2)}</span>
                       </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add to List'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
