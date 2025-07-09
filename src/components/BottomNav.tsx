'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Home, User, LayoutGrid, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

// Helper component
function NavItem({ item, isActive }: { item: { href: string; label: string; icon: React.ElementType }, isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary w-20',
        isActive && 'text-primary'
      )}
    >
      <item.icon className="h-6 w-6" />
      <span className="text-xs font-medium">{item.label}</span>
    </Link>
  )
}

const baseNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/marketplace', label: 'Categories', icon: LayoutGrid },
  { href: '/calculator', label: 'Calculator', icon: Calculator, auth: true, role: 'customer' },
  { href: '/account', label: 'Profile', icon: User, auth: true },
];

const scannerItem = { href: '/scanner', label: 'Scan', icon: ScanLine, auth: true, role: 'customer' };

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/marketplace') return pathname === '/marketplace';
    return pathname.startsWith(href);
  }

  const itemsToDisplay = baseNavItems.filter(item => {
    if (item.auth && (loading || !user)) return false;
    if (item.role && user?.user_metadata?.role !== item.role) return false;
    return true;
  });

  const showScanner = scannerItem.auth && user && user.user_metadata?.role === scannerItem.role && !loading;

  // Regular flex layout for guests or vendors
  if (!showScanner) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm md:hidden">
        <div className="container flex h-16 w-full items-center justify-around px-4">
          {itemsToDisplay.map((item) => (
            <NavItem key={item.href} item={item} isActive={getIsActive(item.href)} />
          ))}
        </div>
      </nav>
    );
  }

  // Special layout for customers with floating button
  const middleIndex = Math.ceil(itemsToDisplay.length / 2);
  const leftItems = itemsToDisplay.slice(0, middleIndex);
  const rightItems = itemsToDisplay.slice(middleIndex);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-20 md:hidden">
        {/* Floating Action Button */}
        <div className="absolute top-0 left-1/2 z-10 h-16 w-16 -translate-x-1/2">
           <Link href={scannerItem.href} passHref>
              <Button
                size="icon"
                className="h-full w-full rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background hover:bg-primary/90"
                aria-label={scannerItem.label}
              >
                <scannerItem.icon className="h-8 w-8" />
              </Button>
            </Link>
         </div>

        {/* The nav bar */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 border-t bg-card/95 backdrop-blur-sm">
            <div className="container flex h-full items-center justify-between px-2">
                {/* Left Items */}
                <div className="flex flex-1 justify-around">
                    {leftItems.map(item => <NavItem key={item.href} item={item} isActive={getIsActive(item.href)} />)}
                </div>
                {/* Placeholder for FAB */}
                <div className="w-16 flex-shrink-0" /> 
                {/* Right Items */}
                <div className="flex flex-1 justify-around">
                    {rightItems.map(item => <NavItem key={item.href} item={item} isActive={getIsActive(item.href)} />)}
                </div>
            </div>
        </nav>
    </div>
  )
}
