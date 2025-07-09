import { DashboardPage } from '@/components/DashboardPage';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { VendorDashboardPage } from '@/components/vendor/VendorDashboardPage';
import type { ShoppingListItem, Vendor } from '@/types';

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (user && user.user_metadata?.role === 'vendor') {
    return <VendorDashboardPage user={user} />;
  }

  // Fetch vendors and categories for the customer dashboard
  const { data: featuredVendors } = await supabase
    .from('vendors')
    .select('*')
    .limit(3);

  const { data: allVendors } = await supabase.from('vendors').select('category');
  const categories = [...new Set(allVendors?.map(v => v.category).filter(Boolean) as string[])];

  // Default to customer/guest view
  let shoppingListItems: ShoppingListItem[] = [];
  if (user) {
    const { data } = await supabase
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true });
    shoppingListItems = data || [];
  }

  return (
    <DashboardPage 
      user={user as SupabaseUser | null} 
      shoppingListItems={shoppingListItems} 
      featuredVendors={(featuredVendors as Vendor[]) || []}
      categories={categories || []}
    />
  );
}
