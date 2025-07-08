'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { vendors as allVendors } from '@/data/vendors';
import type { User } from '@supabase/supabase-js';
import type { ShoppingListItem } from '@/app/page';
import { ShoppingList } from './shopping-list/ShoppingList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search as SearchIcon, Leaf, Cake, Paintbrush, Utensils, Shirt } from 'lucide-react';
import Link from 'next/link';

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

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {user && shoppingListItems.length > 0 && (
             <ShoppingList items={shoppingListItems} />
          )}

          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3 font-headline">
              Welcome to LocalBloom
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your one-stop destination to discover local vendors and find the best prices on fresh products.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative w-full">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  name="search"
                  placeholder="Search for apples, bread, t-shirts..." 
                  className="pl-12 w-full bg-card h-14 text-base rounded-full shadow-lg"
                />
                <Button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 rounded-full">
                  Search
                </Button>
            </form>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(category => {
                const Icon = categoryIcons[category] || Leaf;
                return (
                  <Link key={category} href={`/products?category=${encodeURIComponent(category)}`} className="block group">
                    <Card className="text-center hover:bg-primary/10 hover:border-primary transition-all duration-300">
                      <CardContent className="p-6 flex flex-col items-center justify-center">
                        <Icon className="h-10 w-10 text-primary mb-3" />
                        <h3 className="font-semibold text-foreground">{category}</h3>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
