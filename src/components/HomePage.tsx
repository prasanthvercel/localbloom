"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { vendors as allVendors } from '@/data/vendors';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Search as SearchIcon, SearchX, ShoppingCart } from 'lucide-react';
import { ProductResultCard, type ProductWithVendor } from '@/components/ProductResultCard';
import { VendorCard } from '@/components/VendorCard';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export function HomePage() {
  const [view, setView] = useState<'products' | 'marketplace'>('products');
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
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
            Find the Best Local Deals
          </h1>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Your one-stop destination to discover local vendors and find the best prices on fresh products.
          </p>

          <Tabs value={view} onValueChange={(v) => setView(v as 'products' | 'marketplace')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
              <TabsTrigger value="products">
                <SearchIcon className="h-4 w-4 mr-2" />
                Find Products
              </TabsTrigger>
              <TabsTrigger value="marketplace">
                <Compass className="h-4 w-4 mr-2" />
                Explore Marketplace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-8">
              <div className="max-w-3xl mx-auto">
                <div className="relative w-full mb-8">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Search for apples, bread, tacos..." 
                      className="pl-12 w-full bg-card h-14 text-base rounded-full shadow-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {hasSearched ? (
                  foundProducts.length > 0 ? (
                    <motion.div layout className="space-y-4">
                      <h2 className="text-lg font-semibold text-center">Found {foundProducts.length} result{foundProducts.length > 1 ? 's' : ''} for "{searchQuery}"</h2>
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
                    <div className="text-center py-16 bg-card rounded-lg shadow-sm">
                      <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h2 className="mt-4 text-xl font-semibold text-foreground">No Products Found</h2>
                      <p className="text-muted-foreground mt-2">We couldn't find "{searchQuery}" at any local vendors.</p>
                    </div>
                  )
                ) : (
                    <div className="text-center py-16 bg-card rounded-lg shadow-sm">
                        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h2 className="mt-4 text-xl font-semibold text-foreground">Start Your Search</h2>
                        <p className="text-muted-foreground mt-2">Type a product name in the search bar above to begin.</p>
                    </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Explore All Vendors</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {allVendors.map(vendor => (
                              <VendorCard key={vendor.id} vendor={vendor} />
                          ))}
                      </div>
                  </div>
                  <div className="lg:col-span-1">
                      <div className="sticky top-24">
                          <MapPlaceholder vendors={allVendors} />
                      </div>
                  </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
