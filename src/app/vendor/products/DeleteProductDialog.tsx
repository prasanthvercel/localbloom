
'use client'

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { deleteProduct } from './actions';

interface DeleteProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  onProductDeleted: (productId: string) => void;
}

export function DeleteProductDialog({ isOpen, setIsOpen, product, onProductDeleted }: DeleteProductDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setIsLoading(true);
    const result = await deleteProduct(product.id);
    
    if (result.success) {
      toast({
        title: 'Product Deleted',
        description: `"${product.name}" has been removed from your shop.`,
      });
      onProductDeleted(product.id);
      setIsOpen(false);
    } else {
       toast({
        title: 'Error',
        description: result.error || 'Failed to delete product.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the product
            <span className="font-semibold"> {product?.name}</span> from your shop.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Yes, delete it'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
