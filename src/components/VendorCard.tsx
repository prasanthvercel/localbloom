import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketPercent } from 'lucide-react';
import type { Vendor } from '@/types';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const hasDiscount = vendor.products?.some(p => p.discount);
  
  return (
    <Link href={`/vendor/${vendor.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative">
            <Image
              src={vendor.image || 'https://placehold.co/400x250.png'}
              alt={vendor.name || 'Vendor'}
              width={400}
              height={250}
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={`${vendor.category} market stall`}
            />
            {hasDiscount && (
              <Badge variant="destructive" className="absolute top-3 right-3 bg-accent text-accent-foreground">
                <TicketPercent className="h-3 w-3 mr-1" />
                Discount
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">{vendor.category}</Badge>
          <CardTitle className="text-lg font-semibold leading-snug tracking-tight mb-1 font-headline truncate">{vendor.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{vendor.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
