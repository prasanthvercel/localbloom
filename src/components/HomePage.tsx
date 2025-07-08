"use client";

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { VendorCard } from '@/components/VendorCard';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { vendors as allVendors, type Vendor } from '@/data/vendors';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';

const categories = ['All', 'Produce', 'Bakery', 'Crafts', 'Food'];

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredVendors = useMemo(() => {
    if (activeCategory === 'All') {
      return allVendors;
    }
    return allVendors.filter(vendor => vendor.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
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
          </div>

          <aside className="lg:col-span-1 lg:sticky top-8 self-start">
            <MapPlaceholder vendors={allVendors} />
          </aside>
        </div>
      </main>
    </div>
  );
}
