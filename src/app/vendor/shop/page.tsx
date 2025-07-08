
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { ShopForm } from './ShopForm';
import { cookies } from 'next/headers';
import type { Vendor } from '@/data/vendors';

export default async function ShopSettingsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'vendor') {
    redirect('/vendor/login');
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found
    console.error('Error fetching vendor profile:', error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShopForm user={user} vendor={vendor as Vendor | null} />
      </main>
    </div>
  );
}
