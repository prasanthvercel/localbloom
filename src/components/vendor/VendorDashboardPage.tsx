
'use client';

import React from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Building, PackagePlus, User as UserIcon } from 'lucide-react';

interface VendorDashboardPageProps {
    user: SupabaseUser;
}

export function VendorDashboardPage({ user }: VendorDashboardPageProps) {

  const getFirstName = (emailOrName: string | undefined) => {
    if (!emailOrName) return 'Vendor';
    if (emailOrName.includes(' ')) {
        return emailOrName.split(' ')[0];
    }
    if (emailOrName.includes('@')) {
        return emailOrName.split('@')[0];
    }
    return emailOrName;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline">
                    Welcome, {getFirstName(user.user_metadata?.full_name || user.email)}!
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    This is your dashboard. Manage your shop, products, and view your performance.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Building className="h-6 w-6 text-primary" />
                           My Shop
                        </CardTitle>
                        <CardDescription>
                            View and update your shop's details, hours, and description.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/vendor/shop">Manage Shop</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PackagePlus className="h-6 w-6 text-primary" />
                           My Products
                        </CardTitle>
                        <CardDescription>
                            Add new products, edit existing ones, and manage your inventory.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/vendor/products">Manage Products</Link>
                        </Button>
                    </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <UserIcon className="h-6 w-6 text-primary" />
                           My Account
                        </CardTitle>
                        <CardDescription>
                            Update your personal account information and password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                           <Link href="/account">Update Account</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Your performance at a glance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-40 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Charts and stats coming soon!</p>
                    </div>
                </CardContent>
            </Card>

        </div>
      </main>
    </div>
  );
}
