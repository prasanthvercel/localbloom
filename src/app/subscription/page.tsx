
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    price: '₹0',
    description: 'Get a taste of what LocalBloom can do.',
    features: [
      '3 free scans per month',
      'Basic product identification',
      'Community access',
    ],
    cta: 'Your Current Plan',
    isCurrent: true,
  },
  {
    name: 'Basic Scanner',
    price: '₹249',
    price_period: '/ month',
    description: 'Perfect for the regular market-goer.',
    features: [
      '100 scans per month',
      'Instant price comparisons',
      'Personalized wellness advice',
      'Full nutrition analysis',
    ],
    cta: 'Upgrade to Basic',
    isCurrent: false,
    isFeatured: true,
  },
  {
    name: 'Pro Scanner',
    price: '₹499',
    price_period: '/ month',
    description: 'For the power shopper and wellness enthusiast.',
    features: [
      '300 scans per month',
      'All Basic features',
      'Priority access to new features',
      'AI-powered weekly diet plans',
    ],
    cta: 'Upgrade to Pro',
    isCurrent: false,
    isFeatured: false,
  },
];

export default function SubscriptionPage() {
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
          {tiers.map((tier) => (
            <Card key={tier.name} className={`transform transition-all hover:shadow-xl ${tier.isFeatured ? 'border-primary border-2 shadow-lg hover:scale-105' : 'hover:-translate-y-2'}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
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
                <Button size="lg" className="w-full mt-auto" disabled={tier.isCurrent}>
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center text-muted-foreground text-sm">
            <p>For now, subscription management is not implemented. This is a placeholder page.</p>
            <Link href="/" className="underline hover:text-primary">Go back home</Link>
        </div>
      </main>
    </div>
  );
}
