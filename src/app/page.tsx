import { HomePage } from '@/components/HomePage';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export type ShoppingListItem = {
  id: number;
  product_name: string;
  vendor_name: string;
  price: number;
  quantity: number;
  image_url: string;
  bought: boolean;
};

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  let shoppingListItems: ShoppingListItem[] = [];
  if (user) {
    const { data } = await supabase
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true });
    shoppingListItems = data || [];
  }

  return <HomePage user={user as User | null} shoppingListItems={shoppingListItems} />;
}
