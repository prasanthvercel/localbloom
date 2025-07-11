'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

type UpdateExpenseResult = {
  success: boolean;
  error?: string;
  updatedExpense?: { id: number; item_name: string; amount: number };
};

export async function updateExpense(
  itemId: number,
  itemName: string,
  amount: number
): Promise<UpdateExpenseResult> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to update expenses.' };
  }

  if (!itemName || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Invalid item data.' };
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({ item_name: itemName, amount: amount })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Could not update expense. Please try again.' };
  }

  revalidatePath('/calculator');
  return { success: true, updatedExpense: data };
}
