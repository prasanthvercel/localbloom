'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { VendorCard } from '@/components/VendorCard';
import type { Vendor } from '@/data/vendors';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

interface VendorGridProps {
    vendors: Vendor[];
}

export function VendorGrid({ vendors }: VendorGridProps) {
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const vendorsToShow = useMemo(() => {
        return vendors.slice(0, visibleCount);
    }, [vendors, visibleCount]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prevCount) =>
                        Math.min(prevCount + ITEMS_PER_PAGE, vendors.length)
                    );
                }
            },
            { rootMargin: "200px" }
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
    }, [vendors.length]);

    return (
        <div>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {vendorsToShow.map((vendor, index) => (
                         <motion.div
                            key={vendor.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index % ITEMS_PER_PAGE * 0.05 }}
                        >
                            <VendorCard vendor={vendor} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            {visibleCount < vendors.length && (
                <div ref={loadMoreRef} className="flex justify-center items-center p-8 space-x-2 text-muted-foreground">
                   <Loader2 className="h-5 w-5 animate-spin" />
                   <span>Loading more vendors...</span>
                </div>
            )}
        </div>
    );
}
