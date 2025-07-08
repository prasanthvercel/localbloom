"use client"

import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Vendor } from '@/data/vendors';

interface MapPlaceholderProps {
  vendors: Vendor[];
}

export function MapPlaceholder({ vendors }: MapPlaceholderProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline">Vendor Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="aspect-square w-full bg-secondary rounded-lg relative overflow-hidden">
            {/* This is a decorative map background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{backgroundImage: "url('https://placehold.co/600x600.png')"}}
              data-ai-hint="map background"
            ></div>
            {vendors.map((vendor) => (
              <Tooltip key={vendor.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125"
                    style={{ top: `${vendor.location.lat}%`, left: `${vendor.location.lng}%` }}
                  >
                    <MapPin className="h-6 w-6 text-primary fill-primary/30" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{vendor.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
