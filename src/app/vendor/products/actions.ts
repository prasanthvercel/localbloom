
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

const productSchema = z.object({
    id: z.string().uuid().optional(),
    vendor_id: z.string().uuid(),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    image: z.string().url('Invalid URL').optional().or(z.literal('')),
    discount: z.string().optional(),
    // For simplicity, we'll take strings for these and split them.
    // In a real app, you might use a more complex component.
    sizes: z.string().optional(), 
    colors: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function saveProduct(formData: ProductFormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const validation = productSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }
  
  const { id, vendor_id, sizes, colors, ...productData } = validation.data;

  const dataToUpsert = {
    ...productData,
    vendor_id,
    id: id || undefined, // Let Supabase generate if it's a new product
    sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : null,
    colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : null,
    image: productData.image || 'https://placehold.co/100x100.png',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('products')
    .upsert(dataToUpsert)
    .select()
    .single();

  if (error) {
    console.error('Error saving product:', error);
    return { success: false, error: `Could not save product: ${error.message}` };
  }

  revalidatePath('/vendor/products');
  return { success: true, data };
}

export async function deleteProduct(productId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: `Could not delete product: ${error.message}` };
    }
    
    revalidatePath('/vendor/products');
    return { success: true };
}
