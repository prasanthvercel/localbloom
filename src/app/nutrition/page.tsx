
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan-flow';
import type { WeeklyDietPlan, NutritionLog, Profile, DailyPlan, Meal } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import { Loader2, Utensils, Zap, ShieldAlert, HeartPulse, Gem } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateWellnessProfile } from './actions';
import { Textarea } from '@/components/ui/textarea';
import { SubscriptionPromptDialog } from '@/components/scanner/SubscriptionPromptDialog';

const dayIndexToName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const wellnessProfileSchema = z.object({
  height: z.coerce.number().positive('Height must be a positive number.'),
  weight: z.coerce.number().positive('Weight must be a positive number.'),
  wellness_goal: z.string().min(1, 'Please select a goal.'),
  health_conditions: z.string().optional(),
});

function WellnessProfileForm({ profile, onProfileUpdated }: { profile: Profile | null, onProfileUpdated: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof wellnessProfileSchema>>({
        resolver: zodResolver(wellnessProfileSchema),
        defaultValues: {
            height: profile?.height || undefined,
            weight: profile?.weight || undefined,
            wellness_goal: profile?.wellness_goal || '',
            health_conditions: profile?.health_conditions || '',
        },
    });
    
    const onSubmit = async (values: z.infer<typeof wellnessProfileSchema>) => {
        setIsLoading(true);
        const result = await updateWellnessProfile(values);
        if (result.success) {
            toast({ title: 'Profile Updated!', description: 'Generating your new diet plan...' });
            onProfileUpdated();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsLoading(false);
    }
    
    return (
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><HeartPulse className="text-primary"/> Complete Your Wellness Profile</CardTitle>
                <CardDescription>
                    We need these details to generate your personalized nutrition plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="height"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Height (cm)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 175" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Weight (kg)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g. 70" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="wellness_goal"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Primary Goal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your wellness goal" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                                    <SelectItem value="Maintain Weight">Maintain Weight</SelectItem>
                                    <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                                    <SelectItem value="General Health">General Health</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="health_conditions"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Health Conditions or Allergies</FormLabel>
                                <FormControl>
                                <Textarea placeholder="e.g., Diabetes, Lactose Intolerant" {...field} />
                                </FormControl>
                                <FormDescription>
                                This helps us create a safe and effective diet plan for you.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save & Generate Plan'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function NutritionSubscriptionGate() {
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);

  return (
    <>
      <SubscriptionPromptDialog isOpen={showSubscriptionPrompt} setIsOpen={setShowSubscriptionPrompt} />
      <div className="flex flex-col min-h-screen bg-secondary/30">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Gem className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl pt-4">Unlock Personalized Nutrition</CardTitle>
              <CardDescription>
                This is a premium feature. Subscribe to get access to AI-generated weekly diet plans, progress tracking, and personalized advice based on your wellness goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={() => setShowSubscriptionPrompt(true)}>
                View Subscription Plans
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}


const NutritionPage = () => {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dietPlan, setDietPlan] = useState<WeeklyDietPlan | null>(null);
    const [nutritionLog, setNutritionLog] = useState<NutritionLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);


    const weekInterval = useMemo(() => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
        end: endOfWeek(new Date(), { weekStartsOn: 1 }), // Sunday
    }), []);

    const weekDays = eachDayOfInterval(weekInterval);

    const fetchPlanAndLog = useCallback(async (currentUser: User, currentProfile: Profile) => {
        setIsLoading(true);
        setError(null);
        setIsProfileIncomplete(false);

        try {
            const [plan, log] = await Promise.all([
                generateDietPlan({
                    height: currentProfile.height!,
                    weight: currentProfile.weight!,
                    wellness_goal: currentProfile.wellness_goal!,
                    health_conditions: currentProfile.health_conditions || undefined,
                    language: 'English',
                }),
                supabase.from('nutrition_log')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .gte('log_date', format(weekInterval.start, 'yyyy-MM-dd'))
                    .lte('log_date', format(weekInterval.end, 'yyyy-MM-dd')),
            ]);
            
            setDietPlan(plan);
            if (log.data) setNutritionLog(log.data);
            if (log.error) {
                console.warn('Could not fetch nutrition log:', log.error.message);
            }

        } catch (e) {
            console.error(e);
            setError('Could not generate your diet plan. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase, weekInterval]);

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login?redirect=/nutrition');
                return;
            }
            setUser(user);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                 setError('Could not load your profile. Please try again.');
                 setIsLoading(false);
                 return;
            }
            
            if (profileData) {
                setProfile(profileData);
                const subscribed = profileData.subscription_tier && profileData.subscription_tier !== 'free';
                setIsSubscribed(subscribed);

                if (!subscribed) {
                    setIsLoading(false);
                    return;
                }

                if (!profileData.height || !profileData.weight || !profileData.wellness_goal) {
                    setIsProfileIncomplete(true);
                    setIsLoading(false);
                    return;
                }

                setProfile(profileData);
                await fetchPlanAndLog(user, profileData);
            } else {
                 // No profile found, which means not subscribed and incomplete
                setIsSubscribed(false);
                setIsLoading(false);
            }
        };
        initialize();
    }, [supabase, router, fetchPlanAndLog]);

    const handleProfileUpdated = async () => {
        if (!user) return;
        setIsLoading(true);
        // Refetch profile data to get the latest
        const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (updatedProfile) {
            setProfile(updatedProfile);
            await fetchPlanAndLog(user, updatedProfile);
        } else {
             setError("Failed to reload profile after update.");
             setIsLoading(false);
        }
    }

    const getLoggedMealsForDate = (date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        return nutritionLog.filter(log => log.log_date === dateString);
    };

    const calculateConsumedTotals = (date: Date): { calories: number; protein: number; carbs: number; fat: number; } => {
        const loggedMeals = getLoggedMealsForDate(date);
        return loggedMeals.reduce((acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-semibold text-lg">Loading your nutrition data...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!isSubscribed) {
        return <NutritionSubscriptionGate />;
    }
    
    if (isProfileIncomplete) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                    <WellnessProfileForm
                        profile={profile}
                        onProfileUpdated={handleProfileUpdated}
                    />
                </main>
            </div>
        )
    }

    if (error) {
         return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                    <Card className="max-w-md text-center">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center justify-center gap-2"><ShieldAlert /> An Error Occurred</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p>{error}</p>
                            <Button asChild>
                                <Link href="/account">Go to My Account</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-secondary/30">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-headline">
                            Your Weekly Nutrition Plan
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Here's your AI-powered diet plan for {format(weekInterval.start, 'MMM d')} - {format(weekInterval.end, 'MMM d, yyyy')}.
                        </p>
                    </div>
                    
                    <Tabs defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
                            {weekDays.map(day => (
                                <TabsTrigger key={day.toString()} value={format(day, 'yyyy-MM-dd')}>
                                    {format(day, 'E')}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {weekDays.map(day => {
                            const dayName = dayIndexToName[getDay(day)] as keyof WeeklyDietPlan;
                            const dailyPlan = dietPlan ? dietPlan[dayName] : null;
                            const consumedTotals = calculateConsumedTotals(day);
                            const loggedMeals = getLoggedMealsForDate(day);

                            if (!dailyPlan) return null;

                            return (
                                <TabsContent key={day.toString()} value={format(day, 'yyyy-MM-dd')}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{format(day, 'EEEE, MMMM d')}</CardTitle>
                                            <CardDescription>
                                                Goal: {dailyPlan.daily_totals.calories.toFixed(0)} kcal
                                                {' | '}
                                                Consumed: {consumedTotals.calories.toFixed(0)} kcal
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <DailyProgress dailyPlan={dailyPlan} consumedTotals={consumedTotals} />
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <MealCard title="Suggested Meals" icon={Zap} meals={Object.values(dailyPlan).slice(0, 4) as Meal[]} />
                                                <MealCard title="Logged Meals" icon={Utensils} meals={loggedMeals} isLogged />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            )
                        })}
                    </Tabs>

                </div>
            </main>
        </div>
    );
};

const DailyProgress = ({ dailyPlan, consumedTotals }: { dailyPlan: DailyPlan, consumedTotals: any }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ProgressTracker label="Calories" consumed={consumedTotals.calories} goal={dailyPlan.daily_totals.calories} unit="kcal" />
                <ProgressTracker label="Protein" consumed={consumedTotals.protein} goal={dailyPlan.daily_totals.protein} unit="g" />
                <ProgressTracker label="Carbs" consumed={consumedTotals.carbs} goal={dailyPlan.daily_totals.carbs} unit="g" />
                <ProgressTracker label="Fat" consumed={consumedTotals.fat} goal={dailyPlan.daily_totals.fat} unit="g" />
            </div>
        </div>
    );
};

const ProgressTracker = ({ label, consumed, goal, unit }: { label: string; consumed: number; goal: number; unit: string; }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-baseline">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{consumed.toFixed(0)}{unit} / {goal.toFixed(0)}{unit}</p>
        </div>
        <Progress value={goal > 0 ? (consumed / goal) * 100 : 0} />
    </div>
);


const MealCard = ({ title, icon: Icon, meals, isLogged = false }: { title: string, icon: React.ElementType, meals: any[], isLogged?: boolean }) => (
    <Card className="bg-muted/50">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {meals.length > 0 ? meals.map((meal, index) => (
                <div key={index} className="text-sm">
                    <p className="font-semibold text-foreground">{isLogged ? meal.food_name : meal.name} {isLogged && <span className="text-xs font-normal text-muted-foreground">({meal.meal_type})</span>}</p>
                    {!isLogged && <p className="text-xs text-muted-foreground">{meal.description}</p>}
                    <p className="text-xs text-muted-foreground">{meal.calories.toFixed(0)} kcal &bull; {meal.protein.toFixed(0)}g P &bull; {meal.carbs.toFixed(0)}g C &bull; {meal.fat.toFixed(0)}g F</p>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No meals {isLogged ? 'logged' : 'suggested'} for today.</p>}
        </CardContent>
    </Card>
);

export default NutritionPage;
