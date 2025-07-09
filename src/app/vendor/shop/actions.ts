
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Vendor } from '@/types';

type VendorUpdateData = {
  id?: string;
  user_id: string;
  name: string;
  category: string;
  description: string;
  image?: string;
}

export async function updateShopDetails(details: VendorUpdateData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== details.user_id) {
    return { success: false, error: 'Unauthorized.' };
  }
  
  const vendorData = {
    user_id: details.user_id,
    name: details.name,
    category: details.category,
    description: details.description,
    image: details.image || 'https://placehold.co/400x250.png', // Default image
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
