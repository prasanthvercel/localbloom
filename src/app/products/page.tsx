import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { ProductResults } from '@/components/products/ProductResults';
import type { ProductWithVendor, ShoppingListItem } from '@/types';

async function getProducts(supabase: ReturnType<typeof createClient>, category?: string, query?: string): Promise<ProductWithVendor[]> {
  const lowercasedQuery = query?.toLowerCase().trim() ?? '';
  let productQuery = supabase.from('products').select('*, vendors(id, name, category)');

  if (category) {
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('category', category);
    
    if (vendorError || !vendors || vendors.length === 0) return [];
    
    const vendorIds = vendors.map(v => v.id);
    productQuery = productQuery.in('vendor_id', vendorIds);
  }

  if (lowercasedQuery !== '') {
    productQuery = productQuery.ilike('name', `%${lowercasedQuery}%`);
  }

  const { data: productsData, error } = await productQuery.order('price', { ascending: true });

  if (error || !productsData) {
    console.error('Error fetching products:', error);
    return [];
  }

  const results: ProductWithVendor[] = productsData.map(p => ({
    ...p,
    vendorId: p.vendors?.id || '',
    vendorName: p.vendors?.name || 'Unknown Vendor',
    lowPrice: false, // Default to false
  }));

  // If there was a search query, mark the items with the lowest price
  if (lowercasedQuery !== '' && results.length > 0) {
    const lowestPrice = results[0].price;
    results.forEach(r => {
      if (r.price === lowestPrice) {
        r.lowPrice = true;
      }
    });
  }

  return results;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  
  const products = await getProducts(supabase, category, searchQuery);

  let shoppingListItems: ShoppingListItem[] = [];
  if (user) {
    const { data } = await supabase
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true });
    shoppingListItems = data || [];
  }

  return (
    <ProductResults
      user={user as User | null}
      shoppingListItems={shoppingListItems}
      initialProducts={products}
      searchQuery={searchQuery}
      category={category}
    />
  );
}
