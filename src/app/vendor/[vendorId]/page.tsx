import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, MapPin as MapPinIcon, Sparkles, Tag, Shirt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
import type { Vendor, Product } from '@/types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  const { data: vendors } = await supabase.from('vendors').select('id');
  return vendors?.map(vendor => ({ vendorId: vendor.id })) || [];
}

async function getVendor(vendorId: string): Promise<Vendor | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, products(*)')
    .eq('id', vendorId)
    .single();
  
  if (error || !vendor) {
    return null;
  }
  return vendor as Vendor;
}

export default async function VendorPage({ params }: { params: { vendorId: string } }) {
  const vendor = await getVendor(params.vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <Card className="overflow-hidden mb-8 shadow-lg">
          <div className="relative h-64 w-full">
            <Image
              src={vendor.image || 'https://placehold.co/400x250.png'}
              alt={vendor.name || 'Vendor'}
              fill
              sizes="100vw"
              className="object-cover"
              data-ai-hint={`${vendor.category} market vendor`}
              priority
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-0 left-0 p-6">
                {vendor.category && <Badge variant="secondary" className="mb-2">{vendor.category}</Badge>}
                <h1 className="text-4xl font-extrabold tracking-tight text-white font-headline">{vendor.name}</h1>
             </div>
          </div>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{vendor.description}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vendor.products && vendor.products.length > 0 ? (
                vendor.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="text-muted-foreground col-span-full text-center py-8">This vendor hasn't added any products yet.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 font-headline flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Hours</h3>
                  <p className="text-muted-foreground">Market hours are typically Saturdays from 8 AM to 2 PM.</p>
                </div>
                 <div>
                  <h3 className="text-lg font-semibold mb-3 font-headline flex items-center"><MapPinIcon className="mr-2 h-5 w-5 text-primary" /> Location</h3>
                  <p className="text-muted-foreground">Find us at the main market square!</p>
                   <div className="mt-2 h-40 w-full rounded-lg bg-secondary flex items-center justify-center">
                     <p className="text-sm text-muted-foreground">Map coming soon</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="block h-full group">
      <Card className="overflow-hidden flex flex-col h-full group">
        <div className="relative">
          <Image src={product.image || 'https://placehold.co/200x200.png'} alt={product.name} width={200} height={200} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" data-ai-hint="produce food" />
          {product.discount && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              <Tag className="h-3 w-3 mr-1" />{product.discount}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h4 className="font-semibold text-foreground truncate flex-grow">{product.name}</h4>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</p>
            {product.lowPrice && (
              <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10 py-0.5 px-1.5 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Best Price
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
