
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Product, Vendor } from '@/types';
import { ProductEditForm } from './ProductEditForm';

async function getProductAndVendor(productId: string, userId: string) {
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, vendors!inner(id, user_id)')
        .eq('id', productId)
        .eq('vendors.user_id', userId) // RLS is good, but this ensures we don't even fetch it if not owned
        .single();
    
    if (productError || !productData) {
        console.error("Error fetching product or unauthorized access:", productError);
        return { product: null, vendor: null };
    }

    const { vendors: vendorData, ...product } = productData;

    return { product: product as Product, vendor: vendorData as Vendor };
}


export default async function EditProductPage({ params }: { params: { productId: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'vendor') {
    redirect('/vendor/login');
  }

  const { product, vendor } = await getProductAndVendor(params.productId, user.id);

  if (!product || !vendor) {
    notFound();
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductEditForm product={product} />
      </main>
    </div>
  );
}

