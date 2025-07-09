
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { HeartPulse } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  address: z.string().min(3, { message: 'Address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
  pincode: z.string().min(3, { message: 'Pincode is required.' }),
  mobile_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid mobile number.' }),
  height: z.union([z.literal(''), z.coerce.number().positive('Height must be a positive number.')]).optional().nullable(),
  weight: z.union([z.literal(''), z.coerce.number().positive('Weight must be a positive number.')]).optional().nullable(),
  wellness_goal: z.string().optional().nullable(),
  health_conditions: z.string().optional().nullable(),
});

interface AccountFormProps {
  user: SupabaseUser;
  profile: Profile | null;
}

export function AccountForm({ user, profile }: AccountFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      pincode: profile?.pincode || '',
      mobile_number: profile?.mobile_number || '',
      height: profile?.height || '',
      weight: profile?.weight || '',
      wellness_goal: profile?.wellness_goal || '',
      health_conditions: profile?.health_conditions || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: values.full_name },
    });

    if (updateError) {
      toast({ title: 'Error', description: updateError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const profileDataForUpsert = {
      ...values,
      height: values.height === '' ? null : values.height,
      weight: values.weight === '' ? null : values.weight,
      wellness_goal: values.wellness_goal || null,
      health_conditions: values.health_conditions || null,
    };
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
        ...profileDataForUpsert,
      });

    if (profileError) {
      toast({
        title: 'Profile Update Failed',
        description: profileError.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your information has been saved successfully.',
      });
       router.push('/');
       router.refresh(); // To ensure middleware re-validates the profile
    }
    setIsLoading(false);
  };

  const isNewUser = !profile?.full_name;

  return (
    <div className="flex items-center justify-center py-12 px-4">
       <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{isNewUser ? 'Welcome! Complete Your Profile' : 'My Account'}</CardTitle>
                  <CardDescription>
                    {isNewUser ? 'Please fill in your details to continue.' : 'Update your account information here.'}
                    <p className="mt-2 text-sm text-muted-foreground">Email: {user.email}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobile_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Area)</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Market St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Springfield" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State / Province</FormLabel>
                              <FormControl>
                                <Input placeholder="Illinois" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode / ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="62704" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="USA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2"><HeartPulse className="text-primary"/>Wellness Goals</CardTitle>
                    <CardDescription className="text-sm">This helps us provide personalized nutritional advice from the scanner. This is optional and only used if you subscribe.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Height (cm)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="e.g. 175" {...field} value={field.value ?? ''} />
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
                                  <Input type="number" placeholder="e.g. 70" {...field} value={field.value ?? ''} />
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
                              <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
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
                            <FormLabel>Health Conditions or Allergies (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="e.g., Diabetes, Lactose Intolerant, Peanut Allergy" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>
                              List any conditions or allergies so we can provide safer, more tailored advice.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </CardContent>
              </Card>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </form>
          </Form>
    </div>
  );
}
