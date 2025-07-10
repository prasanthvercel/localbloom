'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { cookies } from 'next/headers';

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

  // Check if an un-bought item already exists in the shopping list
  const { data: existingItem, error: fetchError } = await supabase
    .from('shopping_list_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_name', productName)
    .eq('vendor_name', vendorName)
    .eq('bought', false) // Only look for items that haven't been bought yet
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: row not found
      console.error('Error fetching existing item:', fetchError);
      return { success: false, error: 'Could not check your shopping list.' };
  }
  
  if (existingItem) {
    // If an un-bought item exists, update its quantity
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
      .eq('user_id', user.id);

    if (updateError) {
        console.error('Error updating quantity:', updateError);
        return { success: false, error: `Could not update item quantity: ${updateError.message}` };
    }

  } else {
    // If item does not exist or the existing one is already bought, insert a new one
    const { error: insertError } = await supabase.from('shopping_list_items').insert({
      user_id: user.id,
      product_name: productName,
      vendor_name: vendorName,
      price,
      quantity,
      image_url: imageUrl,
      bought: false,
    });

    if (insertError) {
      console.error('Error adding to shopping list:', insertError);
      return { success: false, error: `Could not add item to your list: ${insertError.message}` };
    }
  }

  revalidatePath('/');
  return { success: true, message: `${productName} added to your shopping list!` };
}

export async function toggleItemBoughtStatus(itemId: number, bought: boolean) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'You must be logged in.' };

  const { error } = await supabase
    .from('shopping_list_items')
    .update({ bought })
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating item status:', error);
    return { success: false, error: `Could not update item status: ${error.message}` };
  }
  
  revalidatePath('/');
  return { success: true };
}


export async function moveItemsToExpenses(itemIds: number[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'You must be logged in.' };
  if (!itemIds || itemIds.length === 0) {
    return { success: false, error: 'No items selected to move.' };
  }

  // 1. Get all the shopping list items to be moved
  const { data: items, error: fetchError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .in('id', itemIds)
    .eq('user_id', user.id);
    
  if (fetchError || !items || items.length === 0) {
    console.error('Error fetching shopping items:', fetchError);
    return { success: false, error: 'Could not find the items to move.' };
  }

  // 2. Prepare them for the expenses table
  const expenseDate = format(new Date(), 'yyyy-MM-dd');
  const expensesToInsert = items.map(item => {
    const totalAmount = item.price * item.quantity;
    const finalItemName = item.quantity > 1 ? `${item.product_name} (x${item.quantity})` : item.product_name;
    return {
      user_id: user.id,
      item_name: finalItemName,
      amount: totalAmount,
      expense_date: expenseDate,
    };
  });

  // 3. Add to expenses table
  const { error: insertError } = await supabase.from('expenses').insert(expensesToInsert);

  if (insertError) {
    console.error('Error adding to expenses:', insertError);
    return { success: false, error: `Could not add items to expenses: ${insertError.message}` };
  }

  // 4. Delete from shopping list table
  const { error: deleteError } = await supabase
    .from('shopping_list_items')
    .delete()
    .in('id', itemIds)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting from shopping list:', deleteError);
    // Don't fail the whole operation, but log the error. The items are in expenses now.
  }
  
  revalidatePath('/');
  revalidatePath('/calculator');
  return { success: true, message: `${itemIds.length} item(s) moved to expenses!` };
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
        return { success: false, error: `Could not delete item: ${error.message}` };
    }
    
    revalidatePath('/');
    return { success: true, message: 'Item removed from your list.' };
}
