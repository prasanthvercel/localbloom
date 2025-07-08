import { vendors, type Product, type Vendor } from '@/data/vendors';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { ProductPurchaseCard } from '@/components/products/ProductPurchaseCard';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@supabase/supabase-js';

export type ProductWithVendor = Product & {
  vendorId: string;
  vendorName: string;
  vendorRating: number;
};

// Helper to find product and its vendor
function getProductDetails(productId: string): { product: ProductWithVendor; vendor: Vendor } | null {
  for (const vendor of vendors) {
    for (const product of vendor.products) {
      if (product.id === productId) {
        return { 
          product: {
            ...product,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorRating: vendor.rating,
          }, 
          vendor 
        };
      }
    }
  }
  return null;
}

// Helper to get related products
function getRelatedProducts(currentProduct: Product, currentVendor: Vendor): ProductWithVendor[] {
  // Logic: other products from the same category, excluding the current one
  const related: ProductWithVendor[] = [];
  const currentCategory = vendors.find(v => v.id === currentVendor.id)?.category;

  if (!currentCategory) return [];

  for (const vendor of vendors) {
    // Look in same category, but give preference to different vendors for variety
    if (vendor.category === currentCategory) {
      for (const product of vendor.products) {
        if (product.id !== currentProduct.id) {
          related.push({
             ...product,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorRating: vendor.rating,
          });
        }
      }
    }
  }
  
  // Return a shuffled slice of the first 4 related products
  return related.sort(() => 0.5 - Math.random()).slice(0, 4);
}

export async function generateStaticParams() {
  const paths: { productId: string }[] = [];
  vendors.forEach(vendor => {
    vendor.products.forEach(product => {
      paths.push({ productId: product.id });
    });
  });
  return paths;
}

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const details = getProductDetails(params.productId);

  if (!details) {
    notFound();
  }

  const { product, vendor } = details;
  const relatedProducts = getRelatedProducts(product, vendor);

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
                  src={product.image}
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
            <ProductPurchaseCard product={product} vendor={vendor} user={user as User | null} />
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
          <Image src={product.image} alt={product.name} width={400} height={400} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" data-ai-hint="product food" />
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground truncate">{product.name}</h4>
          <p className="text-sm text-muted-foreground">{product.vendorName}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
