import { Header } from '@/components/Header';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { VendorCard } from '@/components/VendorCard';
import { vendors as allVendors } from '@/data/vendors';

export default function MarketplacePage() {
    return (
        <div className="flex flex-col min-h-screen bg-secondary/30">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-center mb-2 font-headline">
                        Explore the Marketplace
                    </h1>
                    <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                        Discover all the talented local vendors and what they have to offer.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">All Vendors</h2>
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
                </div>
            </main>
        </div>
    );
}
