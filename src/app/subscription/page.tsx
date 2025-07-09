
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { createRazorpayOrder, verifyPaymentAndUpdateProfile } from './actions';
import { useRouter } from 'next/navigation';

// This is to inform TypeScript that the Razorpay object will be available on the window
declare const Razorpay: any;

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    price_period: '',
    description: 'Get a taste of what LocalBloom can do.',
    features: [
      '3 free scans per month',
      'Basic product identification',
      'Community access',
    ],
    cta: 'Your Current Plan',
  },
  {
    id: 'basic',
    name: 'Basic Scanner',
    price: 249,
    price_period: '/ month',
    description: 'Perfect for the regular market-goer.',
    features: [
      '100 scans per month',
      'Instant price comparisons',
      'Personalized wellness advice',
      'Full nutrition analysis',
    ],
    cta: 'Upgrade to Basic',
    isFeatured: true,
  },
  {
    id: 'pro',
    name: 'Pro Scanner',
    price: 499,
    price_period: '/ month',
    description: 'For the power shopper and wellness enthusiast.',
    features: [
      '300 scans per month',
      'All Basic features',
      'Priority access to new features',
      'AI-powered weekly diet plans',
    ],
    cta: 'Upgrade to Pro',
    isFeatured: false,
  },
];

export default function SubscriptionPage() {
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(profileData);
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [supabase]);

    const handlePayment = async (tier: typeof tiers[number]) => {
        if (!user || !profile) {
            toast({ title: 'Please log in', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        if (tier.price === 0) return;

        setIsProcessingPayment(tier.id);

        try {
            const order = await createRazorpayOrder({
                amountInPaise: tier.price * 100,
                plan: tier.name,
            });

            if (!order) {
                throw new Error('Could not create Razorpay order.');
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'LocalBloom',
                description: `Subscription for ${tier.name}`,
                order_id: order.id,
                handler: async function (response: any) {
                    const result = await verifyPaymentAndUpdateProfile({
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        plan: tier.id,
                    });
                    
                    if (result.success) {
                        toast({ title: 'Payment Successful!', description: `Welcome to the ${tier.name} plan!` });
                        router.push('/account'); // Redirect to a relevant page
                    } else {
                        toast({ title: 'Payment Failed', description: result.error, variant: 'destructive' });
                    }
                },
                prefill: {
                    name: profile.full_name || '',
                    email: user.email || '',
                    contact: profile.mobile_number || '',
                },
                theme: {
                    color: '#9F5BDE', // primary color
                },
            };

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            toast({ title: 'An Error Occurred', description: 'Could not initiate payment. Please try again.', variant: 'destructive' });
        } finally {
            setIsProcessingPayment(null);
        }
    };

    const currentPlanId = profile?.subscription_tier || 'free';

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-headline">
            Choose the Right Plan for You
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful features to shop smarter, eat healthier, and save money.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 items-start">
          {tiers.map((tier) => {
            const isCurrent = tier.id === currentPlanId;
            return (
                <Card key={tier.name} className={`transform transition-all hover:shadow-xl ${tier.isFeatured ? 'border-primary border-2 shadow-lg hover:scale-105' : 'hover:-translate-y-2'}`}>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                    <div className="text-center mb-6">
                    <span className="text-4xl font-bold">₹{tier.price}</span>
                    {tier.price_period && <span className="text-muted-foreground">{tier.price_period}</span>}
                    </div>
                    <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                        <div className="bg-green-500/10 p-1 rounded-full">
                            <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                    </ul>
                    <Button 
                        size="lg" 
                        className="w-full mt-auto" 
                        disabled={isLoading || !!isProcessingPayment || isCurrent}
                        onClick={() => handlePayment(tier)}
                    >
                      {isProcessingPayment === tier.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? 'Your Current Plan' : tier.cta}
                    </Button>
                </CardContent>
                </Card>
            );
          })}
        </div>
        {!user && !isLoading && (
            <p className="text-center text-muted-foreground">
                Please <Link href="/login?redirect=/subscription" className="underline font-bold text-primary">log in</Link> to subscribe.
            </p>
        )}
      </main>
    </div>
  );
}
