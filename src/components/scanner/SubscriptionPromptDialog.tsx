
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
import { Gem, HeartPulse, ScanLine, Tag } from 'lucide-react';

interface SubscriptionPromptDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function SubscriptionPromptDialog({ isOpen, setIsOpen }: SubscriptionPromptDialogProps) {
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gem className="text-primary" />
            Upgrade to Unlock Premium
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've used all your free scans for this month. Subscribe to unlock these powerful features and more!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-2">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <ScanLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Unlimited Scanning</h4>
                    <p className="text-sm text-muted-foreground">Scan as many products as you want, anytime.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Instant Price Comparisons</h4>
                    <p className="text-sm text-muted-foreground">Find the best deals from all vendors in the market.</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <HeartPulse className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Personalized Wellness Advice</h4>
                    <p className="text-sm text-muted-foreground">Get diet tips tailored to your health goals.</p>
                </div>
            </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="text-base font-bold text-foreground">Our Plans:</p>
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
