
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Home, LayoutGrid, HeartPulse, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types';

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
  { href: '/calculator', label: 'Expenses', icon: Calculator, auth: true, role: 'customer' },
  { href: '/nutrition', label: 'Nutrition', icon: HeartPulse, auth: true, role: 'customer' },
];

const vendorNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/vendor/products', label: 'Products', icon: LayoutGrid },
  { href: '/vendor/shop', label: 'Shop', icon: Calculator, auth: true, role: 'vendor' },
];

const scannerItem = { href: '/scanner', label: 'Scan', icon: Camera };
const scannerGateItem = { href: '/scanner/gate', label: 'Scan', icon: Camera };

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, subscription_tier')
          .eq('id', currentUser.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('marketplace')) return pathname.startsWith('/marketplace') || pathname.startsWith('/products');
    if (href.includes('scanner')) return pathname.startsWith('/scanner');
    if (href.includes('nutrition')) return pathname.startsWith('/nutrition');
    if (href.includes('calculator')) return pathname.startsWith('/calculator');
    return pathname.startsWith(href);
  }

  const userRole = profile?.role || user?.user_metadata?.role;
  const isSubscribed = profile?.subscription_tier && profile.subscription_tier !== 'free';
  const navItems = userRole === 'vendor' ? vendorNavItems : baseNavItems;

  const itemsToDisplay = navItems.filter(item => {
    if (item.auth && (loading || !user)) return false;
    if (item.role && userRole !== item.role) return false;
    if (item.href === '/nutrition' && !isSubscribed) return false;
    return true;
  });

  const finalScannerItem = user ? scannerItem : scannerGateItem;

  // Regular flex layout for vendors (or if loading)
  if (userRole === 'vendor') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm md:hidden">
        <div className="container flex h-16 w-full items-center justify-around px-4">
          {itemsToDisplay.map((item) => (
            <NavItem key={item.href} item={item} isActive={getIsActive(item.href)} />
          ))}
          <NavItem key="/account" item={{ href: '/account', label: 'Profile', icon: UserIcon }} isActive={getIsActive('/account')} />
        </div>
      </nav>
    );
  }

  // Special layout for customers and guests with floating button
  const middleIndex = Math.ceil(itemsToDisplay.length / 2);
  const leftItems = itemsToDisplay.slice(0, middleIndex);
  const rightItems = itemsToDisplay.slice(middleIndex);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-20 md:hidden">
        {/* Floating Action Button */}
        <div className="absolute top-0 left-1/2 z-10 h-16 w-16 -translate-x-1/2">
           <Link href={finalScannerItem.href} passHref>
              <Button
                size="icon"
                className="h-full w-full rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background hover:bg-primary/90"
                aria-label={finalScannerItem.label}
              >
                <finalScannerItem.icon className="h-8 w-8" />
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
