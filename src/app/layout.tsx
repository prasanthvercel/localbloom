import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { BottomNav } from '@/components/BottomNav';

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
        {children}
        <Toaster />
        <BottomNav />
      </body>
    </html>
  );
}
