import { Header } from '@/components/Header';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Cake, Paintbrush, Utensils, Shirt, ArrowLeft } from 'lucide-react';
import type { ElementType } from 'react';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const categoryIcons: { [key: string]: ElementType } = {
  Produce: Leaf,
  Bakery: Cake,
  Crafts: Paintbrush,
  Food: Utensils,
  Clothing: Shirt,
};

export default async function MarketplacePage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: vendors, error } = await supabase.from('vendors').select('category');
    const categories = [...new Set(vendors?.map(vendor => vendor.category).filter(Boolean) as string[])];

    return (
        <div className="flex flex-col min-h-screen bg-secondary/30">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="max-w-5xl mx-auto">
                    <div className="mb-6">
                      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                      </Link>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
                        Browse by Category
                    </h1>
                    <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                        Find exactly what you're looking for by exploring our product categories.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {categories.map(category => {
                            const Icon = categoryIcons[category] || Leaf;
                            return (
                            <Link key={category} href={`/products?category=${encodeURIComponent(category)}`} className="block group">
                                <Card className="text-center hover:shadow-lg hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 h-full">
                                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center aspect-square">
                                    <div className="bg-primary/10 p-5 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground text-base sm:text-lg">{category}</h3>
                                </CardContent>
                                </Card>
                            </Link>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
