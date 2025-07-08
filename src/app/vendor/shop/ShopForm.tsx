
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User } from '@supabase/supabase-js';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateShopDetails } from './actions';
import type { Vendor } from '@/data/vendors';

const shopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  image: z.string().url('Please enter a valid image URL.').optional().or(z.literal('')),
});

type ShopFormValues = z.infer<typeof shopSchema>;

interface ShopFormProps {
  user: User;
  vendor: Vendor | null;
}

const categories = ['Produce', 'Bakery', 'Crafts', 'Food', 'Clothing'];

export function ShopForm({ user, vendor }: ShopFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: vendor?.name || '',
      category: vendor?.category || '',
      description: vendor?.description || '',
      image: vendor?.image || '',
    },
  });

  const onSubmit = async (values: ShopFormValues) => {
    setIsLoading(true);

    const result = await updateShopDetails({
      id: vendor?.id, // Can be undefined for new vendors
      user_id: user.id,
      ...values,
    });
    
    if (result.success) {
      toast({
        title: 'Shop Updated',
        description: 'Your shop details have been saved successfully.',
      });
      router.push('/vendor/products'); // Go to next step
      router.refresh();
    } else {
      toast({
        title: 'Update Failed',
        description: result.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const isNewVendor = !vendor?.name;

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{isNewVendor ? 'Set Up Your Shop' : 'Manage Your Shop'}</CardTitle>
          <CardDescription>
            {isNewVendor ? 'Please fill in your shop details to continue.' : 'Update your public-facing shop information here.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fresh Farms Organics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category for your shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                           <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your shop..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Banner Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://placehold.co/400x250.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save and Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
