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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User } from '@supabase/supabase-js';

const profileSchema = z.object({
  full_name: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  address: z.string().min(3, { message: 'Address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
  pincode: z.string().regex(/^\d{5,6}$/, { message: 'Invalid pincode format.' }),
  mobile_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid mobile number.' }),
});

type Profile = z.infer<typeof profileSchema> & {
    id: string;
    updated_at: string;
    avatar_url: string;
    role: string;
}

interface AccountFormProps {
  user: User;
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

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
        ...values,
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
       router.refresh();
    }
    setIsLoading(false);
  };

  const isNewUser = !profile?.full_name;

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{isNewUser ? 'Welcome! Complete Your Profile' : 'My Account'}</CardTitle>
          <CardDescription>
            {isNewUser ? 'Please fill in your details to continue.' : 'Update your account information here.'}
            <p className="mt-2 text-sm text-muted-foreground">Email: {user.email}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
