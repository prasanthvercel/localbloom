'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { cookies } from 'next/headers';

type AddExpenseResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function addExpenseFromProduct(formData: FormData): Promise<AddExpenseResult> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to add expenses.' };
  }

  if (user.user_metadata?.role !== 'customer') {
    return { success: false, error: 'Only customers can add expenses.' };
  }

  const itemName = formData.get('itemName') as string;
  const unitPrice = parseFloat(formData.get('amount') as string);
  const quantity = parseInt(formData.get('quantity') as string, 10);
  
  if (!itemName || isNaN(unitPrice) || isNaN(quantity) || quantity <= 0) {
    return { success: false, error: 'Invalid item data.' };
  }

  const totalAmount = unitPrice * quantity;
  const finalItemName = quantity > 1 ? `${itemName} (x${quantity})` : itemName;


  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    item_name: finalItemName,
    amount: totalAmount,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });

  if (error) {
    console.error('Error adding expense:', error);
    return { success: false, error: 'Could not add item to expenses. Please try again.' };
  }

  revalidatePath('/calculator');
  return { success: true, message: `${finalItemName} has been added to your expense list.` };
}
