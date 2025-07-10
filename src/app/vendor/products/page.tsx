import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import type { Product } from '@/types';
import { ProductListClient } from './ProductListClient';
import { cookies } from 'next/headers';

export default async function VendorProductsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'vendor') {
    redirect('/vendor/login');
  }

  // First, get the vendor's ID
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (vendorError || !vendor) {
    console.error('Vendor not found, redirecting to shop setup.');
    redirect('/vendor/shop');
  }
  
  // Then, fetch the products for that vendor
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Error fetching products:', productsError);
    // Don't redirect, just show an empty list
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <ProductListClient 
            initialProducts={(products as Product[]) || []} 
            vendorId={vendor.id} 
         />
      </main>
    </div>
  );
}
