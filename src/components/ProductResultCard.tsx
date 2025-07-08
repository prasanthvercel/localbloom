import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/data/vendors';
import { Star, Sparkles, Tag, Store } from 'lucide-react';

export type ProductWithVendor = Product & {
  vendorId: string;
  vendorName: string;
  vendorRating: number;
};

interface ProductResultCardProps {
  item: ProductWithVendor;
}

export function ProductResultCard({ item }: ProductResultCardProps) {
  return (
    <Card className="overflow-hidden h-full group transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
       <Link href={`/vendor/${item.vendorId}`} className="block">
        <div className="flex">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36">
            <Image 
              src={item.image} 
              alt={item.name} 
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint="product image"
            />
          </div>
          <CardContent className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base sm:text-lg text-foreground pr-4 line-clamp-2">{item.name}</h3>
              <p className="text-xl sm:text-2xl font-black text-primary">${item.price.toFixed(2)}</p>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
                {item.lowPrice && (
                  <Badge variant="outline" className="border-green-500 text-green-600 bg-green-500/10 py-0.5 px-1.5 text-xs w-fit">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Best Price
                  </Badge>
                )}
                {item.discount && (
                  <Badge variant="outline" className="border-accent text-accent bg-accent/10 py-0.5 px-1.5 text-xs w-fit">
                    <Tag className="h-3 w-3 mr-1" />{item.discount}
                  </Badge>
                )}
            </div>

            <div className="flex-grow" />

            <div className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span className="font-medium">{item.vendorName}</span>
              </div>
              <div className="flex items-center gap-1 text-xs pl-6">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  <span>{item.vendorRating.toFixed(1)} rating</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
