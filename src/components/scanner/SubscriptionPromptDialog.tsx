'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';

interface SubscriptionPromptDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function SubscriptionPromptDialog({ isOpen, setIsOpen }: SubscriptionPromptDialogProps) {
  // In a real app, this would link to a pricing/checkout page.
  const handleSubscribe = () => {
    console.log('Redirecting to subscription page...');
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gem className="text-primary" />
            Upgrade to Continue Scanning
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've used all 3 of your free scans for this month. Please subscribe to unlock unlimited scanning and support the app!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm text-muted-foreground space-y-2 py-4">
          <p><span className="font-bold text-foreground">Basic Plan:</span> $2.99/month for 100 scans.</p>
          <p><span className="font-bold text-foreground">Pro Plan:</span> $5.99/month for 300 scans.</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleSubscribe}>
              View Subscription Plans
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
