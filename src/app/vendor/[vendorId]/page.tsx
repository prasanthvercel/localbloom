import Image from 'next/image';
import Link from 'next/link';
import { vendors, type Product } from '@/data/vendors';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, MapPin as MapPinIcon, Star, Sparkles, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Separator } from '@/components/ui/separator';
import { ReviewCount } from '@/components/vendor/ReviewCount';

export async function generateStaticParams() {
  return vendors.map((vendor) => ({
    vendorId: vendor.id,
  }));
}

function getVendor(vendorId: string) {
  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    notFound();
  }
  return vendor;
}

export default async function VendorPage({ params }: { params: { vendorId: string } }) {
  const vendor = getVendor(params.vendorId);

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
              src={vendor.image}
              alt={vendor.name}
              fill
              className="object-cover"
              data-ai-hint={`${vendor.category} market vendor`}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
             <div className="absolute bottom-0 left-0 p-6">
                <Badge variant="secondary" className="mb-2">{vendor.category}</Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-white font-headline">{vendor.name}</h1>
                <div className="flex items-center gap-2 mt-2 text-amber-300">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-bold text-white">{vendor.rating.toFixed(1)}</span>
                    <ReviewCount />
                </div>
             </div>
          </div>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{vendor.description}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vendor.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 font-headline flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Hours</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    {vendor.hours.map(h => <li key={h.day}><span className="font-medium text-foreground">{h.day}:</span> {h.time}</li>)}
                  </ul>
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

          <TabsContent value="reviews" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>See what others are saying about {vendor.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Reviews are not yet available.</p>
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
          <Image src={product.image} alt={product.name} width={200} height={200} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" data-ai-hint="produce food" />
          {product.discount && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              <Tag className="h-3 w-3 mr-1" />{product.discount}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h4 className="font-semibold text-foreground truncate flex-grow">{product.name}</h4>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
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
