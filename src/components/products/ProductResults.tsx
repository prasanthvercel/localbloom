'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { AnimatePresence, motion } from 'framer-motion';
import { Search as SearchIcon, SearchX, Loader2, ArrowLeft } from 'lucide-react';
import { ProductResultCard, type ProductWithVendor } from '@/components/ProductResultCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';
import type { ShoppingListItem } from '@/app/page';
import { ShoppingList } from '../shopping-list/ShoppingList';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

interface ProductResultsProps {
    user: User | null;
    shoppingListItems: ShoppingListItem[];
    initialProducts: ProductWithVendor[];
    searchQuery?: string;
    category?: string;
}

export function ProductResults({ user, shoppingListItems, initialProducts, searchQuery, category }: ProductResultsProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  
  const productsToShow = useMemo(() => {
    return initialProducts.slice(0, visibleCount);
  }, [initialProducts, visibleCount]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prevCount) =>
            Math.min(prevCount + ITEMS_PER_PAGE, initialProducts.length)
          );
        }
      },
      { rootMargin: "200px" } // Load a bit before it's visible
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [initialProducts.length]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (localSearch.trim()) {
      router.push(`/products?q=${encodeURIComponent(localSearch.trim())}`);
    } else {
      router.push('/products');
    }
  };
  
  const pageTitle = category ? `Products in "${category}"` : (searchQuery ? `Results for "${searchQuery}"` : "All Products");
  const pageDescription = category 
    ? `Discover all products from the ${category} category.`
    : (searchQuery ? `Found ${initialProducts.length} results for your search.` : `Browse all available products from our local vendors.`);

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {user && shoppingListItems.length > 0 && (
             <ShoppingList items={shoppingListItems} />
          )}

          <div className="mb-6">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            {pageDescription}
          </p>
          
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="relative w-full mb-8">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    name="search"
                    placeholder="Search within results..." 
                    className="pl-12 w-full bg-card h-14 text-base rounded-full shadow-lg"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                  <Button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 rounded-full">
                    Search
                  </Button>
              </form>
              
              {initialProducts.length > 0 ? (
                <motion.div layout className="space-y-4">
                  <AnimatePresence>
                    {productsToShow.map((item, index) => (
                      <motion.div
                        key={`${item.vendorId}-${item.name}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ProductResultCard item={item} user={user} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                   {visibleCount < initialProducts.length && (
                    <div ref={loadMoreRef} className="flex justify-center items-center p-4 space-x-2 text-muted-foreground">
                       <Loader2 className="h-5 w-5 animate-spin" />
                       <span>Loading more products...</span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-16 bg-card rounded-lg shadow-sm">
                  <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold text-foreground">No Products Found</h2>
                  <p className="text-muted-foreground mt-2">
                    We couldn't find any products that match your criteria. Try a different search or category.
                  </p>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
