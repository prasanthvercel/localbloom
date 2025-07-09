'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Store, PlusCircle, MinusCircle, Tag } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addItemToShoppingList } from '@/app/shopping-list/actions';
import type { User } from '@supabase/supabase-js';
import type { Vendor, ProductWithVendor as ProductWithVendorType } from '@/types';
import { Input } from '../ui/input';

interface ProductPurchaseCardProps {
  product: ProductWithVendorType;
  vendor: Vendor;
  user: User | null;
}

export function ProductPurchaseCard({ product, vendor, user }: ProductPurchaseCardProps) {
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to add items to your list.', variant: 'destructive' });
      return;
    }
    if (user.user_metadata?.role !== 'customer') {
      toast({ title: 'Action not allowed', description: 'Only customers can add items to a shopping list.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    
    let productName = product.name;
    if (selectedColor) productName += ` - ${selectedColor}`;
    if (selectedSize) productName += ` (${selectedSize})`;

    formData.append('productName', productName);
    formData.append('price', product.price.toString());
    formData.append('quantity', quantity.toString());
    formData.append('vendorName', vendor.name || 'Local Vendor');
    formData.append('imageUrl', product.image || 'https://placehold.co/100x100.png');
    
    const result = await addItemToShoppingList(formData);

    if (result.success) {
      toast({
        title: 'Item Added!',
        description: result.message,
      });
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

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <Link href={`/vendor/${vendor.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>{vendor.name}</span>
          </div>
        </Link>
        <CardTitle className="text-2xl lg:text-3xl font-extrabold !mt-1">{product.name}</CardTitle>
        <div className="flex items-baseline gap-2 !mt-2">
          <p className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
          {product.discount && (
            <Badge variant="outline" className="border-accent text-accent bg-accent/10">
                <Tag className="h-3 w-3 mr-1" />{product.discount}
            </Badge>
          )}
        </div>
        <CardDescription className="!mt-4 text-base">{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Separator />

          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <Label>Color: <span className="font-semibold">{selectedColor}</span></Label>
              <RadioGroup value={selectedColor} onValueChange={setSelectedColor} className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <Label key={color} htmlFor={`color-${color}`} className="cursor-pointer has-[input:checked]:ring-2 has-[input:checked]:ring-primary has-[input:checked]:ring-offset-2 has-[input:checked]:ring-offset-background rounded-md p-0.5">
                    <RadioGroupItem value={color} id={`color-${color}`} className="sr-only" />
                    <div style={{ backgroundColor: color.toLowerCase().replace(/\s+/g, '') }} className="h-8 w-8 rounded-md border" title={color} />
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <Label>Size: <span className="font-semibold">{selectedSize}</span></Label>
              <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <Label key={size} htmlFor={`size-${size}`} className="cursor-pointer has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground has-[input:checked]:border-primary rounded-md border px-3 py-1.5 text-sm font-medium">
                    <RadioGroupItem value={size} id={`size-${size}`} className="sr-only" />
                    {size}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}
          
          <div className="flex items-center gap-4">
             <Label>Quantity</Label>
             <div className="flex items-center justify-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                    <MinusCircle className="h-4 w-4" />
                </Button>
                <Input
                    name="quantity_display"
                    className="w-16 h-9 text-center text-base font-bold"
                    value={quantity}
                    readOnly
                />
                <Button type="button" variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
             </div>
          </div>
          
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !user || user.user_metadata?.role !== 'customer'}>
            {isSubmitting ? 'Adding...' : 'Add to Shopping List'}
          </Button>
          {!user && <p className="text-center text-sm text-muted-foreground">Please <Link href="/login" className="underline font-semibold">log in</Link> to add items.</p>}
          {user && user.user_metadata?.role !== 'customer' && <p className="text-center text-sm text-muted-foreground">Only customers can have a shopping list.</p>}

        </form>
      </CardContent>
    </Card>
  );
}
