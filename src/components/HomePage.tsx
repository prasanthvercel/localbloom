"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { VendorCard } from '@/components/VendorCard';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { vendors as allVendors, type Vendor } from '@/data/vendors';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

const categories = ['All', 'Produce', 'Bakery', 'Crafts', 'Food'];

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = useMemo(() => {
    let vendors = allVendors;
    
    if (activeCategory !== 'All') {
      vendors = vendors.filter(vendor => vendor.category === activeCategory);
    }

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      vendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(lowercasedQuery) ||
        vendor.products.some(product =>
          product.name.toLowerCase().includes(lowercasedQuery)
        )
      );
    }

    return vendors;
  }, [activeCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4 font-headline">
              Welcome to LocalBloom
            </h1>
            <p className="text-muted-foreground mb-6">Discover the best local vendors in your area.</p>

            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-5 bg-secondary p-1 h-auto">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="text-xs sm:text-sm">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            {filteredVendors.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredVendors.map((vendor) => (
                     <motion.div
                      key={vendor.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <VendorCard vendor={vendor} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <SearchX className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold text-foreground">No Vendors Found</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your search or category filters.</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1 lg:sticky top-8 self-start">
            <MapPlaceholder vendors={filteredVendors} />
          </aside>
        </div>
      </main>
    </div>
  );
}
