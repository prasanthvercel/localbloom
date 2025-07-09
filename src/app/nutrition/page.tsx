
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { generateDietPlan } from '@/ai/flows/generate-diet-plan-flow';
import type { WeeklyDietPlan, NutritionLog, Profile, DailyPlan, Meal } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import { Loader2, Utensils, Zap, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const dayIndexToName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const NutritionPage = () => {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dietPlan, setDietPlan] = useState<WeeklyDietPlan | null>(null);
    const [nutritionLog, setNutritionLog] = useState<NutritionLog[]>([]);
    const [error, setError] = useState<string | null>(null);

    const weekInterval = {
        start: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
        end: endOfWeek(new Date(), { weekStartsOn: 1 }), // Sunday
    };
    const weekDays = eachDayOfInterval(weekInterval);

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
            
            if (profileError || !profileData || !profileData.height || !profileData.weight || !profileData.wellness_goal) {
                setError('Please complete your wellness profile in your account settings to use the nutrition planner.');
                setIsLoading(false);
                return;
            }
            setProfile(profileData);

            try {
                const [plan, log] = await Promise.all([
                    generateDietPlan({
                        height: profileData.height,
                        weight: profileData.weight,
                        wellness_goal: profileData.wellness_goal,
                        language: 'English',
                    }),
                    supabase.from('nutrition_log')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('log_date', format(weekInterval.start, 'yyyy-MM-dd'))
                        .lte('log_date', format(weekInterval.end, 'yyyy-MM-dd')),
                ]);
                
                setDietPlan(plan);
                if (log.data) setNutritionLog(log.data);
                if (log.error) {
                    console.warn('Could not fetch nutrition log. You may need to create the `nutrition_log` table in Supabase.');
                }

            } catch (e) {
                console.error(e);
                setError('Could not generate your diet plan. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [supabase, router]);

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
                        <p className="font-semibold text-lg">Generating your personalized plan...</p>
                        <p>This may take a moment.</p>
                    </div>
                </main>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                    <Card className="max-w-md text-center">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center justify-center gap-2"><ShieldAlert /> Profile Incomplete</CardTitle>
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
