
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
import { Gem, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPromptDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAnonymous: boolean;
}

export function SubscriptionPromptDialog({ isOpen, setIsOpen, isAnonymous }: SubscriptionPromptDialogProps) {
  
  if (isAnonymous) {
     return (
       <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserPlus className="text-primary" />
                Join to Continue Scanning
              </AlertDialogTitle>
              <AlertDialogDescription>
                You've used all your free anonymous scans. Create a free account or log in to get more monthly scans and unlock personalized wellness advice.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Maybe Later</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="outline" asChild>
                  <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Log In</Link>
                </Button>
              </AlertDialogAction>
              <AlertDialogAction asChild>
                <Button asChild>
                  <Link href="/register">Sign Up Free</Link>
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
     )
  }

  // Default prompt for logged-in users
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gem className="text-primary" />
            Upgrade for Your Wellness Goals
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've used all 3 of your free scans for this month. Subscribe to unlock unlimited scanning, instant price comparisons, and personalized wellness advice based on your diet goals!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm text-muted-foreground space-y-2 py-4">
          <p><span className="font-bold text-foreground">Basic Plan:</span> ₹249/month for 100 scans & personalized advice.</p>
          <p><span className="font-bold text-foreground">Pro Plan:</span> ₹499/month for 300 scans & personalized advice.</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Maybe Later</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>
              View Subscription Plans
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
