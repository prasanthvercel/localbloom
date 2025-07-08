'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calculator', label: 'Calculator', icon: Calculator, auth: true, role: 'customer' },
  { href: '/account', label: 'Profile', icon: User, auth: true },
];

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
    return pathname.startsWith(href);
  }

  const itemsToDisplay = navItems.filter(item => {
    if (item.auth && (loading || !user)) return false;
    if (item.role && user?.user_metadata?.role !== item.role) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="container flex h-16 items-center justify-around px-4">
        {itemsToDisplay.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary',
              getIsActive(item.href) && 'text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
