import { Header } from '@/components/Header';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { VendorGrid } from '@/components/marketplace/VendorGrid';
import { vendors as allVendors } from '@/data/vendors';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function VendorsPage() {
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <VendorGrid vendors={allVendors} />
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <MapPlaceholder vendors={allVendors} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
