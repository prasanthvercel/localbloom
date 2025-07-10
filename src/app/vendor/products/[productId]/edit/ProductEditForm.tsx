
'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/types';
import { saveProduct } from '../../actions';
import { ImageUploader } from '@/components/ImageUploader';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProductEditFormProps {
    product: Product;
}

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    unit: z.string().optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    image: z.any().optional(),
    discount: z.string().optional(),
    sizes: z.string().optional(), 
    colors: z.string().optional(),
});

export function ProductEditForm({ product }: ProductEditFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: product.name,
            price: product.price,
            unit: product.unit || '',
            description: product.description || '',
            image: product.image || null,
            discount: product.discount || '',
            sizes: product.sizes?.join(', ') || '',
            colors: product.colors?.join(', ') || '',
        }
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append('id', product.id); // IMPORTANT: Pass the ID for upsert
        formData.append('name', values.name);
        formData.append('price', values.price.toString());
        formData.append('description', values.description);

        if (values.unit) formData.append('unit', values.unit);
        if (values.discount) formData.append('discount', values.discount);
        if (values.sizes) formData.append('sizes', values.sizes);
        if (values.colors) formData.append('colors', values.colors);

        if (values.image instanceof File) {
            formData.append('image', values.image);
        } else if (typeof values.image === 'string' && values.image) {
            formData.append('existingImageUrl', values.image);
        }
        
        const result = await saveProduct(formData);

        if (result.success && result.data) {
            toast({
                title: 'Product Updated',
                description: `"${result.data.name}" has been saved.`,
            });
            // Refresh the page to show the new image if it was updated
            router.refresh();
        } else {
             toast({
                title: 'Error',
                description: result.error || 'There was a problem saving the product.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4">
                <Link href="/vendor/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Products
                </Link>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>
                        Update product details and manage the product image here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describe your product, its features, and what makes it special..." {...field} rows={5} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    
                                    <FormField control={form.control} name="image" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Image</FormLabel>
                                            <FormControl>
                                                <ImageUploader 
                                                    value={field.value} 
                                                    onChange={field.onChange}
                                                    className="aspect-square"
                                                    aspectRatio={1}
                                                />
                                            </FormControl>
                                            <FormDescription>Recommended: 1:1 (Square). Click image to crop.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                
                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="price" render={({ field }) => (
                                            <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="299" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="unit" render={({ field }) => (
                                            <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="kg, lb, piece" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <FormField control={form.control} name="discount" render={({ field }) => (
                                        <FormItem><FormLabel>Discount (Optional)</FormLabel><FormControl><Input placeholder="e.g., 15% off" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="sizes" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Sizes (Optional)</FormLabel>
                                            <FormControl><Input placeholder="S, M, L, XL" {...field} /></FormControl>
                                            <FormDescription>Enter sizes separated by a comma.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="colors" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Available Colors (Optional)</FormLabel>
                                            <FormControl><Input placeholder="Red, Green, Blue" {...field} /></FormControl>
                                            <FormDescription>Enter colors separated by a comma.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" disabled={isLoading} size="lg">
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

