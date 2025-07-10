
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const productActionSchema = z.object({
    id: z.string().uuid().optional().nullable(),
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

  // First, verify ownership and get the vendor ID associated with this user.
  // This is the most important security check and the root of the previous issues.
  const { data: vendorData, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendorData) {
      console.error('Vendor not found for user:', user.id, vendorError);
      return { success: false, error: 'Could not find your vendor profile. Please ensure your shop is set up before adding products.' };
  }
  const verifiedVendorId = vendorData.id;


  const rawData = {
      id: formData.get('id'),
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
  
  const { id, ...productData } = validation.data;

  const imageFile = formData.get('image') as File | null;
  const existingImageUrl = formData.get('existingImageUrl') as string | null;
  let imageUrl = existingImageUrl;

  if (imageFile && imageFile.size > 0) {
      // The file path must use the user's ID as the root folder, as per RLS policy.
      const filePath = `${user.id}/${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading product image:', uploadError);
          return { success: false, error: `Could not upload image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrl;

      // If updating, delete the old image
      if (existingImageUrl) {
        try {
            const url = new URL(existingImageUrl);
            // Extract path from Supabase URL: /storage/v1/object/public/product-images/[path]
            const oldPath = url.pathname.split('/product-images/')[1];
            if(oldPath) {
              await supabase.storage.from('product-images').remove([oldPath]);
            }
        } catch (e) {
            console.error("Could not parse or delete old product image", e);
        }
      }
  }

  const dataToUpsert = {
    ...productData,
    vendor_id: verifiedVendorId, // Use the verified vendor ID
    id: id || undefined,
    sizes: productData.sizes ? productData.sizes.split(',').map(s => s.trim()).filter(Boolean) : null,
    colors: productData.colors ? productData.colors.split(',').map(c => c.trim()).filter(Boolean) : null,
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
    // If there is an image URL from a new upload, try to delete it on failure to prevent orphaned files.
    if (imageUrl && imageUrl !== existingImageUrl) {
        try {
            const url = new URL(imageUrl);
            const pathToDelete = url.pathname.split('/product-images/')[1];
            if (pathToDelete) await supabase.storage.from('product-images').remove([pathToDelete]);
        } catch (e) {
            console.error("Failed to clean up orphaned image after DB error", e);
        }
    }
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

    // Before deleting the product, we must verify the user owns it via the vendors table.
    const { data: product } = await supabase
      .from('products')
      .select('image, vendor_id, vendors(user_id)')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, error: 'Product not found.' };
    }

    // Check if the user ID from the joined vendors table matches the logged-in user.
    if (product.vendors?.user_id !== user.id) {
        return { success: false, error: 'You do not have permission to delete this product.' };
    }
    
    // If the check passes, proceed to delete the image from storage.
    if (product.image) {
        try {
            const url = new URL(product.image);
            const path = url.pathname.split('/product-images/')[1];
            if(path) {
                await supabase.storage.from('product-images').remove([path]);
            }
        } catch (e) {
            console.error("Could not parse image URL or delete from storage", e);
        }
    }

    const { error: deleteDbError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (deleteDbError) {
        console.error('Error deleting product from DB:', deleteDbError);
        return { success: false, error: `Could not delete product: ${deleteDbError.message}` };
    }
    
    revalidatePath('/vendor/products');
    return { success: true };
}
