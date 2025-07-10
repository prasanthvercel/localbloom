
'use client';

import 'react-image-crop/dist/ReactCrop.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateShopDetails } from './actions';
import type { Vendor } from '@/types';
import { Separator } from '@/components/ui/separator';
import { QrCode, Printer } from 'lucide-react';
import QRCode from "react-qr-code";
import { ImageUploader } from '@/components/ImageUploader';

const shopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  image: z.any().optional(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

interface ShopFormProps {
  user: SupabaseUser;
  vendor: Vendor | null;
}

const categories = ['Produce', 'Bakery', 'Crafts', 'Food', 'Clothing'];

export function ShopForm({ user, vendor }: ShopFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shopUrl, setShopUrl] = useState('');

  useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== 'undefined' && vendor?.id) {
      setShopUrl(`${window.location.origin}/vendor/${vendor.id}`);
    }
  }, [vendor?.id]);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: vendor?.name || '',
      category: vendor?.category || '',
      description: vendor?.description || '',
      image: vendor?.image || null,
    },
  });

  const onSubmit = async (values: ShopFormValues) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('category', values.category);
    formData.append('description', values.description);
    
    if (values.image instanceof File) {
        formData.append('image', values.image);
    } else if (typeof values.image === 'string' && values.image) {
        formData.append('existingImageUrl', values.image);
    }
    
    const result = await updateShopDetails(formData);
    
    if (result.success) {
      toast({
        title: 'Shop Updated',
        description: 'Your shop details have been saved successfully.',
      });
      router.push('/vendor/products');
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
    <div className="flex items-center justify-center py-12 px-4 print:py-0 print:px-0">
      <div id="qr-code-section" className="hidden print:block text-center p-8">
          <h2 className="text-2xl font-bold mb-2">{vendor?.name}</h2>
          <p className="text-muted-foreground mb-4">Scan to visit our online shop!</p>
          {shopUrl && (
            <div className="bg-white p-4 inline-block rounded-lg shadow-lg">
                <QRCode value={shopUrl} size={256} />
            </div>
          )}
      </div>

      <Card className="w-full max-w-2xl print:hidden">
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
                    <FormLabel>Shop Banner Image</FormLabel>
                    <FormControl>
                      <ImageUploader 
                        value={field.value} 
                        onChange={field.onChange}
                        className="aspect-[16/6]" 
                        aspectRatio={16 / 6}
                      />
                    </FormControl>
                    <FormDescription>Recommended aspect ratio: 16:6. Click image to crop.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save and Continue'}
              </Button>
            </form>
          </Form>

           {!isNewVendor && shopUrl && (
            <>
                <Separator className="my-8" />
                <div className="space-y-4 text-center">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center justify-center gap-2"><QrCode className="text-primary" /> Your Shop QR Code</h3>
                        <p className="text-sm text-muted-foreground">Display this at your stall for customers to scan and shop.</p>
                    </div>
                    <div className="bg-white p-4 inline-block rounded-lg border shadow-sm">
                        <QRCode value={shopUrl} size={128} />
                    </div>
                    <div>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print QR Code
                        </Button>
                    </div>
                </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
