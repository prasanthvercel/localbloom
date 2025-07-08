
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { vendors as allVendors } from '@/data/vendors';
import { AnimatePresence, motion } from 'framer-motion';
import { Search as SearchIcon, SearchX, Loader2 } from 'lucide-react';
import { ProductResultCard, type ProductWithVendor } from '@/components/ProductResultCard';
import { Input } from '@/components/ui/input';
import { ViewToggle } from '@/components/ViewToggle';
import type { User } from '@supabase/supabase-js';
import type { ShoppingListItem } from '@/app/page';
import { ShoppingList } from './shopping-list/ShoppingList';

const ITEMS_PER_PAGE = 10;

interface HomePageProps {
    user: User | null;
    shoppingListItems: ShoppingListItem[];
}

export function HomePage({ user, shoppingListItems }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const allProducts = useMemo((): ProductWithVendor[] => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    const results: ProductWithVendor[] = [];

    allVendors.forEach(vendor => {
      vendor.products.forEach(product => {
        const productName = product.name.toLowerCase();
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

    results.sort((a, b) => a.price - b.price);

    if (lowercasedQuery !== '' && results.length > 0) {
      const lowestPrice = results[0].price;
      results.forEach(r => {
        if (r.price === lowestPrice) {
          r.lowPrice = true;
        }
      });
    }

    return results;
  }, [searchQuery]);
  
  const productsToShow = useMemo(() => {
    return allProducts.slice(0, visibleCount);
  }, [allProducts, visibleCount]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prevCount) =>
            Math.min(prevCount + ITEMS_PER_PAGE, allProducts.length)
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
  }, [allProducts.length]);


  const hasSearched = searchQuery.trim() !== '';

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {user && shoppingListItems.length > 0 && (
             <ShoppingList items={shoppingListItems} />
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
            Find the Best Local Deals
          </h1>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Your one-stop destination to discover local vendors and find the best prices on fresh products.
          </p>
          
          <ViewToggle />

            <div className="max-w-3xl mx-auto">
              <div className="relative w-full mb-8">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search for apples, bread, tacos..." 
                    className="pl-12 w-full bg-card h-14 text-base rounded-full shadow-lg"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(ITEMS_PER_PAGE);
                    }}
                  />
              </div>
              
              {allProducts.length > 0 ? (
                <motion.div layout className="space-y-4">
                   {hasSearched ? (
                      <h2 className="text-lg font-semibold text-center">Found {allProducts.length} result{allProducts.length > 1 ? 's' : ''} for "{searchQuery}"</h2>
                    ) : (
                      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 text-center">All Products</h2>
                    )}
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
                   {visibleCount < allProducts.length && (
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
                  <p className="text-muted-foreground mt-2">We couldn't find "{searchQuery}" at any local vendors.</p>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
