import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProductPurchaseCard } from '@/components/products/ProductPurchaseCard';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent } from '@/components/ui/card';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Product, Vendor, ProductWithVendor } from '@/types';
import { createServerClient } from '@supabase/ssr';

async function getProductDetails(productId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: productData, error } = await supabase
    .from('products')
    .select('*, vendors (id, name, category, description)')
    .eq('id', productId)
    .single();

  if (error || !productData) {
    console.error('Error fetching product:', error);
    return null;
  }
  
  const { vendors: vendorData, ...product } = productData;

  if (!vendorData) return null;

  return {
    product: {
      ...product,
      vendorId: vendorData.id,
      vendorName: vendorData.name || 'Unknown Vendor',
    } as ProductWithVendor,
    vendor: vendorData as Vendor
  };
}

async function getRelatedProducts(currentProduct: Product, currentVendor: Vendor) {
  if (!currentVendor?.category) return [];

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Find other vendors in the same category
  const { data: vendorsInCategory, error: vendorError } = await supabase
    .from('vendors')
    .select('id')
    .eq('category', currentVendor.category);

  if (vendorError || !vendorsInCategory) return [];

  const vendorIds = vendorsInCategory.map(v => v.id);

  // Fetch products from those vendors, excluding the current one
  const { data: relatedProductsData, error: productsError } = await supabase
    .from('products')
    .select('*, vendors(id, name)')
    .in('vendor_id', vendorIds)
    .neq('id', currentProduct.id)
    .limit(4);
  
  if (productsError) return [];
  
  return (relatedProductsData?.map(p => ({
    ...p,
    vendorId: p.vendors?.id || '',
    vendorName: p.vendors?.name || 'Unknown',
  })) || []) as ProductWithVendor[];
}

export async function generateStaticParams() {
  // Create a Supabase client that doesn't rely on cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Return null for all cookie methods
        get: async () => null,
        set: async () => {},
        remove: async () => {},
      },
    }
  );
  const { data: products } = await supabase.from('products').select('id');
  return products?.map(({ id }) => ({ productId: id })) || [];
}

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const details = await getProductDetails(params.productId);

  if (!details) {
    notFound();
  }

  const { product, vendor } = details;
  const relatedProducts = await getRelatedProducts(product, vendor);

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column: Image */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-lg">
              <div className="relative aspect-square w-full">
                <Image
                  src={product.image || 'https://placehold.co/600x600.png'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  data-ai-hint="product photo"
                  priority
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Purchase Info */}
          <div className="lg:col-span-1">
            <ProductPurchaseCard product={product} vendor={vendor} user={user as SupabaseUser | null} />
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// A simple card for related products
function RelatedProductCard({ product }: { product: ProductWithVendor }) {
  return (
    <Link href={`/products/${product.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
        <div className="relative">
          <Image src={product.image || 'https://placehold.co/400x400.png'} alt={product.name} width={400} height={400} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" data-ai-hint="product food" />
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground truncate">{product.name}</h4>
          <p className="text-sm text-muted-foreground">{product.vendorName}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
