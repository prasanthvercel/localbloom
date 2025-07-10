
'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/types';
import { saveProduct } from './actions';
import { useRouter } from 'next/navigation';

interface ProductFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onProductCreated: (product: Product) => void;
}

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    unit: z.string().optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    discount: z.string().optional(),
    sizes: z.string().optional(), 
    colors: z.string().optional(),
});

export function ProductFormDialog({ isOpen, setIsOpen, onProductCreated }: ProductFormDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            price: 0,
            unit: '',
            description: '',
            discount: '',
            sizes: '',
            colors: '',
        }
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                name: '', price: 0, unit: '', description: '', discount: '', sizes: '', colors: ''
            });
        }
    }, [form, isOpen]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('price', values.price.toString());
        formData.append('description', values.description);
       
        if (values.unit) formData.append('unit', values.unit);
        if (values.discount) formData.append('discount', values.discount);
        if (values.sizes) formData.append('sizes', values.sizes);
        if (values.colors) formData.append('colors', values.colors);
        
        // This action now only handles creating a product without an image.
        const result = await saveProduct(formData);

        if (result.success && result.data) {
            toast({
                title: 'Product Created!',
                description: `"${result.data.name}" has been created. Now you can add an image.`,
            });
            onProductCreated(result.data as Product);
            setIsOpen(false);
            // Redirect to the new edit page to upload an image
            router.push(`/vendor/products/${result.data.id}/edit`);
        } else {
             toast({
                title: 'Error',
                description: result.error || 'There was a problem creating the product.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        First, enter the product details. You'll be able to add an image on the next screen.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-6 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe your product, its features, and what makes it special..." {...field} rows={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
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

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Create Product & Continue'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
