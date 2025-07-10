'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

const shopActionSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
});

export async function updateShopDetails(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }
  
  const rawData = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
  };

  const validation = shopActionSchema.safeParse(rawData);
  if (!validation.success) {
      return { success: false, error: JSON.stringify(validation.error.flatten().fieldErrors) };
  }

  const { name, category, description } = validation.data;
  const imageFile = formData.get('image') as File | null;
  const existingImageUrl = formData.get('existingImageUrl') as string | null;
  let imageUrl = existingImageUrl || 'https://placehold.co/400x250.png';

  if (imageFile && imageFile.size > 0) {
      const filePath = `${user.id}/banner-${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
          .from('shop-images')
          .upload(filePath, imageFile);

      if (uploadError) {
          console.error('Error uploading shop image:', uploadError);
          return { success: false, error: `Could not upload image: ${uploadError.message}` };
      }
      
      const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(filePath);
      imageUrl = publicUrl;
  } else if (!imageFile && !existingImageUrl) {
    imageUrl = 'https://placehold.co/400x250.png';
  }
  
  const vendorData = {
    user_id: user.id,
    name,
    category,
    description,
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('vendors').upsert(vendorData, {
    onConflict: 'user_id'
  });

  if (error) {
    console.error('Error updating shop details:', error);
    return { success: false, error: `Could not update shop details: ${error.message}` };
  }

  revalidatePath('/vendor/shop');
  revalidatePath('/');
  revalidatePath('/vendor/[vendorId]', 'page');
  return { success: true };
}
