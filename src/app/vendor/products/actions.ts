
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

  // Handle case for a new product first
  if (!id) {
    // 1. Insert product without image to get an ID
    const initialProductData = {
        ...productData,
        vendor_id: verifiedVendorId,
        sizes: productData.sizes ? productData.sizes.split(',').map(s => s.trim()).filter(Boolean) : null,
        colors: productData.colors ? productData.colors.split(',').map(c => c.trim()).filter(Boolean) : null,
        updated_at: new Date().toISOString(),
    };
    
    const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert(initialProductData)
        .select()
        .single();
    
    if (insertError) {
        console.error('Error creating product record:', insertError);
        return { success: false, error: `Could not create product record: ${insertError.message}` };
    }

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      // 2. Upload image using the new product's ID
      const filePath = `${verifiedVendorId}/${newProduct.id}/${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading product image:', uploadError);
          // Return success but with a warning, as the product itself was created.
          return { success: true, data: newProduct, error: 'Product created, but image upload failed.' };
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      
      // 3. Update the product with the image URL
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({ image: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', newProduct.id)
        .select()
        .single();
        
      if (updateError) {
          console.error('Error updating product with image URL:', updateError);
          return { success: true, data: newProduct, error: 'Product created, but failed to link image.' };
      }
      revalidatePath('/vendor/products');
      return { success: true, data: updatedProduct };
    }
    
    revalidatePath('/vendor/products');
    return { success: true, data: newProduct };
  }


  // Logic for updating an existing product
  const imageFile = formData.get('image') as File | null;
  let imageUrl: string | null = formData.get('existingImageUrl') as string | null;

  if (imageFile && imageFile.size > 0) {
      let oldImagePath: string | null = null;
      if (id) {
          const { data: existingProduct, error: fetchError } = await supabase
              .from('products')
              .select('image')
              .eq('id', id)
              .single();
          if (!fetchError && existingProduct?.image) {
            try {
                const url = new URL(existingProduct.image);
                oldImagePath = url.pathname.split(`/storage/v1/object/public/product-images/`)[1];
            } catch (e) {
                console.error("Could not parse old product image URL", e);
            }
          }
      }

      const filePath = `${verifiedVendorId}/${id}/${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading product image:', uploadError);
          return { success: false, error: `Could not upload image: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = publicUrl;

      if (oldImagePath && oldImagePath.startsWith(verifiedVendorId)) {
        const { error: deleteError } = await supabase.storage.from('product-images').remove([oldImagePath]);
        if(deleteError) {
            console.error("Failed to delete old product image, but continuing.", deleteError);
        }
      }
  }

  const dataToUpsert = {
    ...productData,
    vendor_id: verifiedVendorId,
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
    if (imageUrl && imageUrl !== (formData.get('existingImageUrl') as string | null)) {
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
  revalidatePath(`/vendor/products/${data.id}/edit`);
  revalidatePath(`/products/${data.id}`);
  return { success: true, data };
}


export async function deleteProduct(productId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: product } = await supabase
      .from('products')
      .select('id, image, vendor_id, vendors ( id, user_id )')
      .eq('id', productId)
      .single();

    if (!product) {
      return { success: false, error: 'Product not found.' };
    }

    if (product.vendors?.user_id !== user.id) {
        return { success: false, error: 'You do not have permission to delete this product.' };
    }
    
    const { error: deleteDbError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (deleteDbError) {
        console.error('Error deleting product from DB:', deleteDbError);
        return { success: false, error: `Could not delete product: ${deleteDbError.message}` };
    }

    if (product.image) {
        try {
            const url = new URL(product.image);
            const path = url.pathname.split(`/storage/v1/object/public/product-images/`)[1];
            if(path && path.startsWith(product.vendor_id)) {
                await supabase.storage.from('product-images').remove([path]);
            }
        } catch (e) {
            console.error("Could not parse image URL or delete from storage, but DB record was deleted.", e);
        }
    }
    
    revalidatePath('/vendor/products');
    return { success: true };
}
