"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { vendors as allVendors } from '@/data/vendors';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX, ShoppingCart } from 'lucide-react';
import { ProductResultCard, type ProductWithVendor } from '@/components/ProductResultCard';

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const foundProducts = useMemo((): ProductWithVendor[] => {
    if (searchQuery.trim() === '') {
      return [];
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    const results: ProductWithVendor[] = [];

    allVendors.forEach(vendor => {
      vendor.products.forEach(product => {
        if (product.name.toLowerCase().includes(lowercasedQuery)) {
          results.push({
            ...product,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorRating: vendor.rating,
          });
        }
      });
    });

    results.sort((a, b) => a.price - b.price);

    if (results.length > 0) {
      const lowestPrice = results[0].price;
      results.forEach(r => {
        r.lowPrice = r.price === lowestPrice;
      });
    }

    return results;
  }, [searchQuery]);

  const hasSearched = searchQuery.trim() !== '';

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
                Find the Best Local Prices
            </h1>
            <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">
                Search for any product, and we'll show you who sells it cheapest. Your smart way to shop local and save.
            </p>
            
            {hasSearched ? (
              foundProducts.length > 0 ? (
                <motion.div layout className="grid grid-cols-1 gap-4 mt-8">
                  <h2 className="text-lg font-semibold">Found {foundProducts.length} result{foundProducts.length > 1 ? 's' : ''} for "{searchQuery}"</h2>
                  <AnimatePresence>
                    {foundProducts.map((item, index) => (
                      <motion.div
                        key={`${item.vendorId}-${item.name}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ProductResultCard item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold text-foreground">No Products Found</h2>
                  <p className="text-muted-foreground mt-2">We couldn't find "{searchQuery}" at any local vendors.</p>
                </div>
              )
            ) : (
                 <div className="text-center py-16">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold text-foreground">Start Your Search</h2>
                    <p className="text-muted-foreground mt-2">Type a product name in the search bar above to begin.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
