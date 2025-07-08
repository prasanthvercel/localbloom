import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { ProductResults } from '@/components/products/ProductResults';
import { vendors as allVendors } from '@/data/vendors';
import type { ProductWithVendor } from '@/components/ProductResultCard';
import type { ShoppingListItem } from '@/app/page';

function getProducts(category?: string, query?: string): ProductWithVendor[] {
  const lowercasedQuery = query?.toLowerCase().trim() ?? '';
  let results: ProductWithVendor[] = [];

  allVendors.forEach(vendor => {
    // Filter vendors by category if provided
    if (category && vendor.category.toLowerCase() !== category.toLowerCase()) {
      return;
    }

    vendor.products.forEach(product => {
      const productName = product.name.toLowerCase();
      // Filter products by search query if provided
      if (lowercasedQuery === '' || productName.includes(lowercasedQuery)) {
        results.push({
          ...product,
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorRating: vendor.rating,
          lowPrice: false, // Default to false
        });
      }
    });
  });

  // Sort by price (ascending)
  results.sort((a, b) => a.price - b.price);

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
  
  const products = getProducts(category, searchQuery);

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
