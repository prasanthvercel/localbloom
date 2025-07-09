import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { BottomNav } from '@/components/BottomNav';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'LocalBloom',
  description: 'Your local market hub.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-body antialiased h-full bg-background pb-16 md:pb-0">
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        {children}
        <Toaster />
        <BottomNav />
      </body>
    </html>
  );
}
