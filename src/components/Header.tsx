"use client"

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from './ui/label';

export function Header() {
  return (
    <header className="bg-card border-b border-border/40 sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground font-headline">LocalBloom</span>
        </Link>
        
        <div className="flex-1 flex justify-center px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search vendors..." 
              className="pl-10 w-full bg-secondary focus:bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <Label htmlFor="market-updates" className="font-normal">Market Updates</Label>
                    <Switch id="market-updates" defaultChecked/>
                  </div>
                  <p className="text-xs text-muted-foreground">Get notified about new market days and events.</p>
                </DropdownMenuItem>
                 <DropdownMenuItem className="flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <Label htmlFor="vendor-specials" className="font-normal">Vendor Specials</Label>
                    <Switch id="vendor-specials" />
                  </div>
                   <p className="text-xs text-muted-foreground">Receive alerts for special discounts from vendors.</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
