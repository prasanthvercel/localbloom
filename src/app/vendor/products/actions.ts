
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const productActionSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    vendor_id: z.string().uuid(),
    user_id: z.string().uuid(), // Add user_id for RLS check
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
  if (!user) {
    return { success: false, error: 'Unauthorized: You must be logged in to save a product.' };
  }

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

  // RLS Check: Verify the user ID from the form matches the logged-in user.
  if (validation.data.user_id !== user.id) {
    return { success: false, error: 'Authorization error: You cannot save products for another vendor.' };
  }
  
  const { id, vendor_id, user_id, sizes, colors, ...productData } = validation.data;

  const imageFile = formData.get('image') as File | null;
  const existingImageUrl = formData.get('existingImageUrl') as string | null;
  let imageUrl = existingImageUrl;

  if (imageFile && imageFile.size > 0) {
      // Use user.id for the folder path to match RLS policy
      const filePath = `${user_id}/${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading product image:', uploadError);
          return { success: false, error: `Could not upload image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrl;

      // If there was an old image and we're uploading a new one, delete the old one.
      if (existingImageUrl) {
        try {
            const url = new URL(existingImageUrl);
            const path = url.pathname.split('/product-images/')[1];
            if(path && path.startsWith(user_id)) {
              await supabase.storage.from('product-images').remove([path]);
            }
        } catch (e) {
            console.error("Could not parse or delete old product image", e);
        }
      }
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

    // Before deleting the product, we might need to delete its image from storage.
    // First, get the product details to find the image URL.
    const { data: product } = await supabase
      .from('products')
      .select('image, vendor_id')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, error: 'Product not found.' };
    }
    
    // RLS Check for delete operation
    const { data: vendorData } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', product.vendor_id)
        .single();
    if (!vendorData || vendorData.user_id !== user.id) {
        return { success: false, error: 'You do not have permission to delete this product.' };
    }

    if (product.image) {
        try {
            const url = new URL(product.image);
            const path = url.pathname.split('/product-images/')[1];
            if(path) {
                // Ensure the path starts with the user's ID before deleting
                if (path.startsWith(user.id)) {
                  await supabase.storage.from('product-images').remove([path]);
                }
            }
        } catch (e) {
            console.error("Could not parse image URL or delete from storage", e);
        }
    }

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
