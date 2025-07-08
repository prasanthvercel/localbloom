'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

type AddExpenseResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function addExpenseFromProduct(formData: FormData): Promise<AddExpenseResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to add expenses.' };
  }

  if (user.user_metadata?.role !== 'customer') {
    return { success: false, error: 'Only customers can add expenses.' };
  }

  const itemName = formData.get('itemName') as string;
  const amount = parseFloat(formData.get('amount') as string);
  
  if (!itemName || isNaN(amount)) {
    return { success: false, error: 'Invalid item data.' };
  }

  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    item_name: itemName,
    amount: amount,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  });

  if (error) {
    console.error('Error adding expense:', error);
    return { success: false, error: 'Could not add item to expenses. Please try again.' };
  }

  revalidatePath('/calculator');
  return { success: true, message: `${itemName} has been added to your expense list.` };
}
