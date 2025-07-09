
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logConsumedItem, type LogItemData } from '@/app/nutrition/actions';
import { format } from 'date-fns';
import { AnalyzeProductImageOutput } from '@/ai/flows/analyze-product-image-flow';

interface AddToDietDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  foodName: string;
  nutrition: AnalyzeProductImageOutput['nutrition'];
}

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export function AddToDietDialog({ isOpen, setIsOpen, foodName, nutrition }: AddToDietDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mealType, setMealType] = useState<string | undefined>(undefined);

  const handleLogItem = async () => {
    if (!mealType || !nutrition) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a meal type.' });
      return;
    }

    setIsLoading(true);

    const itemData: LogItemData = {
      food_name: foodName,
      meal_type: mealType,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };

    const result = await logConsumedItem(itemData);

    if (result.success) {
      toast({ title: 'Success!', description: result.message });
      setIsOpen(false);
      setMealType(undefined);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Food Item</DialogTitle>
          <DialogDescription>
            Add <span className="font-semibold">{foodName}</span> to your daily nutrition log.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="meal-type">Select Meal</Label>
                <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger id="meal-type">
                        <SelectValue placeholder="Which meal is this for?" />
                    </SelectTrigger>
                    <SelectContent>
                        {mealTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {nutrition && (
                <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                    <p>Calories: <span className="font-medium text-foreground">{nutrition.calories} kcal</span></p>
                    <p>Protein: <span className="font-medium text-foreground">{nutrition.protein}g</span></p>
                    <p>Carbs: <span className="font-medium text-foreground">{nutrition.carbs}g</span></p>
                    <p>Fat: <span className="font-medium text-foreground">{nutrition.fat}g</span></p>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleLogItem} disabled={isLoading || !mealType}>
            {isLoading ? 'Logging...' : 'Log Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
