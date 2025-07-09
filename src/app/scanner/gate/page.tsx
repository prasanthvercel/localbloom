'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
  {
    title: 'Instant Product Recognition',
    description: 'Just point your camera at any food item to instantly learn what it is, its nutritional value, and helpful tips.',
    image: 'https://placehold.co/600x400.png',
    hint: 'phone scanning fruit',
  },
  {
    title: 'Smart Price Comparison',
    description: "Is that the best deal? We'll instantly check prices from all vendors in the market so you always save money.",
    image: 'https://placehold.co/600x400.png',
    hint: 'price tags comparison',
  },
  {
    title: 'Personalized Wellness Advice',
    description: 'Get tailored advice based on your personal health goals. The scanner becomes your personal nutritionist.',
    image: 'https://placehold.co/600x400.png',
    hint: 'healthy food chart',
  },
];

export default function ScannerGatePage() {
  const router = useRouter();

  const handleRedirect = (path: string) => {
    // We want to redirect back to the scanner after login/register
    const redirectPath = `/scanner`;
    router.push(`${path}?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-headline">
            Unlock Your Smart Shopping Assistant
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            The LocalBloom scanner is more than just a camera. It's a powerful tool to help you shop smarter, eat healthier, and save money. Create a free account to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12">
          {features.map((feature, index) => (
            <Card key={feature.title} className="overflow-hidden transform transition-all hover:-translate-y-2 hover:shadow-xl">
               <div className="relative h-48 w-full">
                <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    data-ai-hint={feature.hint}
                    priority={index === 0}
                />
               </div>
               <CardContent className="p-6 text-left">
                    <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
               </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="max-w-2xl mx-auto bg-card">
            <CardContent className="p-8 space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground">Get Started for Free</h2>
                    <p className="text-muted-foreground mt-2">Create an account to access the scanner and enjoy <span className="font-bold text-primary">3 free scans every month!</span></p>
                </div>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Save items to a persistent shopping list.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Track your monthly expenses automatically.</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Unlock the potential for personalized wellness advice.</li>
                 </ul>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => handleRedirect('/register')} size="lg" className="w-full">
                        <UserPlus className="mr-2 h-5 w-5"/>
                        Create a Free Account
                    </Button>
                    <Button onClick={() => handleRedirect('/login')} size="lg" className="w-full" variant="outline">
                        <LogIn className="mr-2 h-5 w-5"/>
                        I Already Have an Account
                    </Button>
                </div>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}
