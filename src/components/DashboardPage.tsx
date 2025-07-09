
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { vendors as allVendors } from '@/data/vendors';
import type { User } from '@supabase/supabase-js';
import type { ShoppingListItem } from '@/app/page';
import { ShoppingList } from './shopping-list/ShoppingList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search as SearchIcon, Leaf, Cake, Paintbrush, Utensils, Shirt, ArrowRight, Sparkles } from 'lucide-react';
import { VendorCard } from './VendorCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay"

interface DashboardPageProps {
    user: User | null;
    shoppingListItems: ShoppingListItem[];
}

const categoryIcons: { [key: string]: React.ElementType } = {
  Produce: Leaf,
  Bakery: Cake,
  Crafts: Paintbrush,
  Food: Utensils,
  Clothing: Shirt,
};

export function DashboardPage({ user, shoppingListItems }: DashboardPageProps) {
  const router = useRouter();
  const categories = [...new Set(allVendors.map(vendor => vendor.category))];
  const featuredVendors = allVendors.slice(0, 3);
  
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const carouselItems = [
    {
      title: 'Fresh Finds, Local Vibes',
      description: 'Discover the best of your community\'s market, right at your fingertips.',
      image: 'https://placehold.co/1200x400.png',
      hint: 'fresh produce',
    },
    {
      title: 'Handcrafted Goods, Made with Love',
      description: 'From artisanal bread to handmade crafts, find unique items from local vendors.',
      image: 'https://placehold.co/1200x400.png',
      hint: 'artisanal bread',
    },
    {
      title: 'Support Your Local Community',
      description: 'Every purchase supports a local family and strengthens our community.',
      image: 'https://placehold.co/1200x400.png',
      hint: 'community market',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {user && shoppingListItems.length > 0 && (
             <ShoppingList items={shoppingListItems} />
          )}

          {/* Hero Section */}
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem key={index}>
                  <Card className="relative overflow-hidden shadow-xl border-none rounded-2xl">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={1200}
                      height={400}
                      className="w-full h-56 sm:h-80 object-cover"
                      data-ai-hint={item.hint}
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20" />
                    <CardContent className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12">
                      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 font-headline">
                        {item.title}
                      </h1>
                      <p className="text-lg text-white/80 max-w-lg mb-6">
                        {item.description}
                      </p>
                      <form onSubmit={handleSearch} className="relative max-w-lg">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          name="search"
                          placeholder="Search for apples, bread, t-shirts..."
                          className="pl-12 w-full bg-white/90 text-foreground h-14 text-base rounded-full shadow-lg border-transparent focus:ring-primary focus:ring-2"
                        />
                        <Button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 rounded-full">
                          Search
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>


          {/* Categories Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Shop by Category</h2>
              <Link href="/marketplace" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {categories.map(category => {
                const Icon = categoryIcons[category] || Leaf;
                return (
                  <Link key={category} href={`/products?category=${encodeURIComponent(category)}`} className="block group">
                    <Card className="text-center hover:shadow-lg hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                      <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center aspect-square">
                        <div className="bg-primary/10 p-4 rounded-full mb-3 group-hover:bg-primary/20 transition-colors">
                           <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{category}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Featured Vendors Section */}
           <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                  Featured Vendors
                </h2>
                <Link href="/vendors" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                    Explore All Vendors <ArrowRight className="h-4 w-4" />
                </Link>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredVendors.map(vendor => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
            </div>
           </div>

        </div>
      </main>
    </div>
  );
}
