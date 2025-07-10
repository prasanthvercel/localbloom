
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const productActionSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    vendor_id: z.string().uuid(),
    user_id: z.string().uuid(), // Add user_id to validation
    name: z.string().min(3, 'Name must be at least 3 characters'),
    price: z.coerce.number().positive('Price must be a positive number'),
    unit: z.string().optional().nullable(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    discount: z.string().optional().nullable(),
    sizes: z.string().optional().nullable(), 
    colors: z.string().optional().nullable(),
});

export async function saveProduct(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const rawData = {
      id: formData.get('id'),
      vendor_id: formData.get('vendor_id'),
      user_id: formData.get('user_id'),
      name: formData.get('name'),
      price: formData.get('price'),
      unit: formData.get('unit'),
      description: formData.get('description'),
      discount: formData.get('discount'),
      sizes: formData.get('sizes'),
      colors: formData.get('colors'),
  };

  const validation = productActionSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: JSON.stringify(validation.error.flatten().fieldErrors) };
  }
  
  if (user.id !== validation.data.user_id) {
    return { success: false, error: "User ID mismatch. Unauthorized."};
  }
  
  const { id, vendor_id, user_id, sizes, colors, ...productData } = validation.data;
  
  const imageFile = formData.get('image') as File | null;
  const existingImageUrl = formData.get('existingImageUrl') as string | null;
  let imageUrl = existingImageUrl;

  if (imageFile && imageFile.size > 0) {
      // Use user_id for the folder path to match RLS policy
      const filePath = `${user_id}/${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return { success: false, error: `Could not upload image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrl;
  }

  const dataToUpsert = {
    ...productData,
    vendor_id,
    id: id || undefined,
    sizes: sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : null,
    colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : null,
    image: imageUrl,
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
