import { Header } from '@/components/Header';
import { VendorGrid } from '@/components/marketplace/VendorGrid';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types';
import { cookies } from 'next/headers';

export default async function VendorsPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: vendors, error } = await supabase.from('vendors').select('*');

    return (
        <div className="flex flex-col min-h-screen bg-secondary/30">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="max-w-5xl mx-auto">
                    <div className="mb-6">
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                        </Link>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
                        Explore All Vendors
                    </h1>
                    <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                        Discover all the talented local vendors and what they have to offer.
                    </p>
                    
                    <div className="lg:col-span-2">
                        <VendorGrid vendors={(vendors as Vendor[]) || []} />
                    </div>
                </div>
            </main>
        </div>
    );
}
