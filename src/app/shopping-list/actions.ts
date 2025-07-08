'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { format } from 'date-fns';

export async function addItemToShoppingList(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'You must be logged in.' };

  const productName = formData.get('productName') as string;
  const price = parseFloat(formData.get('price') as string);
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const vendorName = formData.get('vendorName') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!productName || isNaN(price) || isNaN(quantity) || quantity <= 0) {
    return { success: false, error: 'Invalid item data.' };
  }
  
  const { error } = await supabase.from('shopping_list_items').insert({
    user_id: user.id,
    product_name: productName,
    vendor_name: vendorName,
    price,
    quantity,
    image_url: imageUrl,
  });

  if (error) {
    console.error('Error adding to shopping list:', error);
    return { success: false, error: 'Could not add item to your list.' };
  }

  revalidatePath('/');
  return { success: true, message: `${productName} added to your shopping list!` };
}

export async function markItemAsBought(itemId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'You must be logged in.' };

  // 1. Get the shopping list item
  const { data: item, error: fetchError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError || !item) {
    console.error('Error fetching shopping item:', fetchError);
    return { success: false, error: 'Could not find the item to mark as bought.' };
  }

  // 2. Add to expenses table
  const totalAmount = item.price * item.quantity;
  const finalItemName = item.quantity > 1 ? `${item.product_name} (x${item.quantity})` : item.product_name;

  const { error: insertError } = await supabase.from('expenses').insert({
    user_id: user.id,
    item_name: finalItemName,
    amount: totalAmount,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });

  if (insertError) {
    console.error('Error adding to expenses:', insertError);
    return { success: false, error: 'Could not add item to expenses.' };
  }

  // 3. Delete from shopping list table
  const { error: deleteError } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId);

  if (deleteError) {
    console.error('Error deleting from shopping list:', deleteError);
  }
  
  revalidatePath('/');
  revalidatePath('/calculator');
  return { success: true, message: 'Item marked as bought and moved to expenses!' };
}

export async function deleteShoppingListItem(itemId: number) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'You must be logged in.' };

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);
    
    if (error) {
        console.error('Error deleting shopping item:', error);
        return { success: false, error: 'Could not delete item.' };
    }
    
    revalidatePath('/');
    return { success: true, message: 'Item removed from your list.' };
}
