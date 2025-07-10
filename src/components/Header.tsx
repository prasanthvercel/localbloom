
"use client"

import Link from 'next/link';
import { LogOut, LogIn, UserPlus, User as UserIcon, ChevronDown, Camera, Settings, Building, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

export function Header() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    fetchUserAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile on auth change:', error);
        }
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    const fetchCategories = async () => {
      const { data: categoriesData, error } = await supabase.from('vendors').select('category');
      if (error) {
        console.error('Error fetching categories:', error);
      } else if (categoriesData) {
        const uniqueCategories = [...new Set(categoriesData.map(v => v.category).filter(Boolean) as string[])];
        setCategories(uniqueCategories);
      }
    };
    
    fetchCategories();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const getInitials = (fullName?: string | null, email?: string | null) => {
    if (fullName) {
      const parts = fullName.split(' ');
      if (parts.length > 1 && parts[1]) {
          return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
      }
      return fullName.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('/marketplace')) return pathname.startsWith('/marketplace') || pathname.startsWith('/products');
    if (href.includes('/scanner')) return pathname.startsWith('/scanner');
    if (href.includes('/nutrition')) return pathname.startsWith('/nutrition');
    if (href.includes('/calculator')) return pathname.startsWith('/calculator');
    if (href.includes('/account')) return pathname.startsWith('/account');
    return pathname.startsWith(href);
  }

  const userRole = profile?.role || user?.user_metadata?.role;
  const isSubscribed = profile?.subscription_tier && profile.subscription_tier !== 'free';
  let navItemsToDisplay: { href: string; label: string; isDropdown?: boolean, icon?: React.ElementType }[] = [];

  if (userRole === 'vendor') {
    navItemsToDisplay = [
      { href: '/', label: 'Dashboard' },
      { href: '/vendor/products', label: 'My Products' },
      { href: '/vendor/shop', label: 'My Shop' },
    ];
  } else {
    navItemsToDisplay = [
      { href: '/', label: 'Home' },
      { href: '/marketplace', label: 'Categories', isDropdown: true },
    ];
    
    if (userRole === 'customer') {
      if (isSubscribed) {
        navItemsToDisplay.push({ href: '/nutrition', label: 'Nutrition' });
      }
      navItemsToDisplay.push({ href: '/calculator', label: 'Expenses' });
    }
    
    navItemsToDisplay.push({ href: user ? '/scanner' : '/scanner/gate', label: 'Scanner', icon: Camera });
  }
  
  const isCategoriesActive = pathname.startsWith('/products') || pathname === '/marketplace';
  
  return (
    <header className="bg-card border-b border-border/40 sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground font-headline">LocalBloom</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItemsToDisplay.map((item) => {
            if (item.isDropdown) {
              return (
                <DropdownMenu key="categories-dropdown">
                  <DropdownMenuTrigger className={cn(
                    'group flex items-center gap-1 outline-none transition-colors hover:text-primary',
                    isCategoriesActive ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {item.label}
                    <ChevronDown className="relative top-px h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/marketplace">All Categories</Link>
                    </DropdownMenuItem>
                    {categories.length > 0 && <DropdownMenuSeparator />}
                    {categories.map((category) => (
                      <DropdownMenuItem key={category} asChild>
                        <Link href={`/products?category=${encodeURIComponent(category)}`}>
                          {category}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            if (item.icon) {
              return (
                <Button key={item.href} asChild variant={getIsActive(item.href) ? 'default' : 'outline'} size="sm">
                  <Link href={item.href}>
                    <item.icon />
                    {item.label}
                  </Link>
                </Button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-primary',
                  getIsActive(item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-grow" />

        <div className="flex items-center gap-2">
          {loading ? (
             <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <>
              <Button asChild variant="ghost" className="px-2 md:px-3">
                <Link href="/account">
                  <Settings className="md:mr-2" />
                  <span className="hidden md:inline">Account</span>
                  <span className="sr-only">Account</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                       <AvatarImage src={profile?.avatar_url || user.user_metadata?.avatar_url} alt={profile?.full_name || user.email!} />
                      <AvatarFallback>{getInitials(profile?.full_name, user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || 'My Account'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Login</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/login" className='cursor-pointer'><LogIn className="mr-2 h-4 w-4" />Customer Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/login" className='cursor-pointer'><LogIn className="mr-2 h-4 w-4" />Vendor Login</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>Sign Up</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/register" className='cursor-pointer'><UserPlus className="mr-2 h-4 w-4" />Customer Sign Up</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/register" className='cursor-pointer'><UserPlus className="mr-2 h-4 w-4" />Vendor Sign Up</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
