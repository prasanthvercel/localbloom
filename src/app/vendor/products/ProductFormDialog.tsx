
'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/data/vendors';
import { saveProduct, type ProductFormData } from './actions';

interface ProductFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    product: Product | null;
    vendorId: string;
    onProductSaved: (product: Product) => void;
}

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    image: z.string().url('Invalid URL').optional().or(z.literal('')),
    discount: z.string().optional(),
    sizes: z.string().optional(), 
    colors: z.string().optional(),
});

export function ProductFormDialog({ isOpen, setIsOpen, product, vendorId, onProductSaved }: ProductFormDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            price: 0,
            description: '',
            image: '',
            discount: '',
            sizes: '',
            colors: '',
        }
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                price: product.price,
                description: product.description,
                image: product.image,
                discount: product.discount || '',
                sizes: product.sizes?.join(', ') || '',
                colors: product.colors?.join(', ') || '',
            });
        } else {
            form.reset({
                name: '', price: 0, description: '', image: '', discount: '', sizes: '', colors: ''
            });
        }
    }, [product, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        
        const formData: ProductFormData = {
            ...values,
            id: product?.id,
            vendor_id: vendorId,
        };

        const result = await saveProduct(formData);

        if (result.success && result.data) {
            toast({
                title: product ? 'Product Updated' : 'Product Added',
                description: `"${result.data.name}" has been saved.`,
            });
            onProductSaved(result.data as Product);
            setIsOpen(false);
        } else {
             toast({
                title: 'Error',
                description: 'There was a problem saving the product.',
                variant: 'destructive',
            });
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3.99" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe your product..." {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="image" render={({ field }) => (
                            <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="discount" render={({ field }) => (
                            <FormItem><FormLabel>Discount (Optional)</FormLabel><FormControl><Input placeholder="e.g., 15% off" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="sizes" render={({ field }) => (
                            <FormItem><FormLabel>Available Sizes (comma-separated)</FormLabel><FormControl><Input placeholder="S, M, L, XL" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="colors" render={({ field }) => (
                            <FormItem><FormLabel>Available Colors (comma-separated)</FormLabel><FormControl><Input placeholder="Red, Green, Blue" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

