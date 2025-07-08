'use client'

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ReviewCount() {
    const [reviewCount, setReviewCount] = useState<number | null>(null);

    useEffect(() => {
        // This runs only on the client, after hydration
        setReviewCount(Math.floor(Math.random() * 100) + 10);
    }, []);

    if (reviewCount === null) {
        // Render a placeholder or skeleton on the server and initial client render
        return <Skeleton className="h-4 w-20 inline-block bg-white/20" />;
    }

    return (
        <span className="text-sm text-white/80">({reviewCount} reviews)</span>
    );
}
