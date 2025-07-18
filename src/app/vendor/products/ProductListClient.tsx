
'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash, Pencil } from 'lucide-react';
import Image from 'next/image';
import { ProductFormDialog } from './ProductFormDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import type { Product } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProductListClientProps {
  initialProducts: Product[];
}

export function ProductListClient({ initialProducts }: ProductListClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const router = useRouter();

    const handleAddProduct = () => {
        setIsFormOpen(true);
    };
    
    const handleDeleteProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteOpen(true);
    };

    const onProductCreated = (newProduct: Product) => {
        setProducts(prev => [newProduct, ...prev]);
    }

    const onProductDeleted = (deletedProductId: string) => {
        setProducts(products.filter(p => p.id !== deletedProductId));
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My Products</CardTitle>
                            <CardDescription>Manage your inventory. Add new items, update pricing, and more.</CardDescription>
                        </div>
                        <Button onClick={handleAddProduct}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length > 0 ? (
                                    products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Image src={product.image || 'https://placehold.co/100x100.png'} alt={product.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint="product photo" />
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                ₹{product.price.toFixed(2)}
                                                {product.unit && <span className="text-muted-foreground text-xs ml-1">/{product.unit}</span>}
                                            </TableCell>
                                            <TableCell>{product.discount || 'N/A'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/vendor/products/${product.id}/edit`}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product)}>
                                                          <Trash className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            You haven't added any products yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <ProductFormDialog
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                onProductCreated={onProductCreated}
            />

            <DeleteProductDialog
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                product={selectedProduct}
                onProductDeleted={onProductDeleted}
            />
        </div>
    );
}
