
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

const LogItemSchema = z.object({
  food_name: z.string(),
  meal_type: z.string(),
  log_date: z.string(), // Validated as date-string by form, but passed as string
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export type LogItemData = z.infer<typeof LogItemSchema>;

export async function logConsumedItem(itemData: LogItemData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to log items.' };
  }

  const { error } = await supabase.from('nutrition_log').insert({
    user_id: user.id,
    ...itemData,
  });

  if (error) {
    console.error('Error logging consumed item:', error);
    return { success: false, error: 'Could not log item. Please try again.' };
  }

  revalidatePath('/nutrition');
  return { success: true, message: `${itemData.food_name} logged successfully!` };
}

const WellnessProfileSchema = z.object({
  height: z.coerce.number().positive('Height must be a positive number.'),
  weight: z.coerce.number().positive('Weight must be a positive number.'),
  wellness_goal: z.string().min(1, 'Please select a goal.'),
  health_conditions: z.string().optional(),
});

export type WellnessProfileData = z.infer<typeof WellnessProfileSchema>;

export async function updateWellnessProfile(data: WellnessProfileData) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }
  
  const parsedData = WellnessProfileSchema.safeParse(data);
  if (!parsedData.success) {
      return { success: false, error: 'Invalid data provided.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      height: parsedData.data.height,
      weight: parsedData.data.weight,
      wellness_goal: parsedData.data.wellness_goal,
      health_conditions: parsedData.data.health_conditions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating wellness profile:', error);
    return { success: false, error: 'Could not update your wellness profile.' };
  }
  
  revalidatePath('/nutrition');
  revalidatePath('/account');
  return { success: true };
}
