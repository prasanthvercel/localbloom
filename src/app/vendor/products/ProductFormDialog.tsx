
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
import type { Product } from '@/data/vendors';
import { saveProduct, type ProductFormData } from './actions';
import Image from 'next/image';
import { generateProductDescription } from '@/ai/flows/generate-product-description-flow';
import { Sparkles } from 'lucide-react';

interface ProductFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    product: Product | null;
    vendorId: string;
    vendorCategory: string;
    onProductSaved: (product: Product) => void;
}

const formSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    unit: z.string().optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    image: z.string().url('Invalid URL').optional().or(z.literal('')),
    discount: z.string().optional(),
    sizes: z.string().optional(), 
    colors: z.string().optional(),
});

export function ProductFormDialog({ isOpen, setIsOpen, product, vendorId, vendorCategory, onProductSaved }: ProductFormDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            price: 0,
            unit: '',
            description: '',
            image: '',
            discount: '',
            sizes: '',
            colors: '',
        }
    });

    const imageUrl = form.watch('image');

    useEffect(() => {
        if (isOpen) {
            if (product) {
                form.reset({
                    name: product.name,
                    price: product.price,
                    unit: product.unit || '',
                    description: product.description,
                    image: product.image,
                    discount: product.discount || '',
                    sizes: product.sizes?.join(', ') || '',
                    colors: product.colors?.join(', ') || '',
                });
            } else {
                form.reset({
                    name: '', price: 0, unit: '', description: '', image: '', discount: '', sizes: '', colors: ''
                });
            }
        }
    }, [product, form, isOpen]);

    const handleGenerateDescription = async () => {
        const productName = form.getValues('name');
        if (!productName) {
            toast({
                title: 'Product Name Required',
                description: 'Please enter a product name before generating a description.',
                variant: 'destructive'
            });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateProductDescription({
                productName,
                category: vendorCategory,
            });
            form.setValue('description', result.description, { shouldValidate: true });
            toast({
                title: 'Description Generated!',
                description: 'The AI has created a description for your product.',
            });
        } catch (error) {
            console.error('Error generating description:', error);
            toast({
                title: 'Generation Failed',
                description: 'Could not generate a description at this time.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

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
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. Good descriptions and images help products sell.
                    </DialogDescription>
                </DialogHeader>
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
                                        <div className="relative">
                                            <FormControl>
                                                <Textarea placeholder="Describe your product, its features, and what makes it special..." {...field} rows={5} />
                                            </FormControl>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="absolute bottom-2 right-2"
                                                onClick={handleGenerateDescription}
                                                disabled={isGenerating}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {isGenerating ? 'Generating...' : 'AI Generate'}
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="image" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image URL</FormLabel>
                                        <FormControl><Input placeholder="https://placehold.co/400x400.png" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                {imageUrl && (
                                    <div className="rounded-md overflow-hidden border border-muted aspect-video relative bg-muted/20">
                                        <Image src={imageUrl} alt="Product preview" fill className="object-contain" onError={(e) => e.currentTarget.style.display = 'none'} data-ai-hint="product image" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="3.99" {...field} /></FormControl><FormMessage /></FormItem>
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

                        <DialogFooter className="pt-4">
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
