'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AuthFormProps = {
  mode: 'login' | 'register';
  userType: 'customer' | 'vendor';
};

export function AuthForm({ mode, userType }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const schema = mode === 'login' ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(mode === 'register' ? { confirmPassword: '' } : {}),
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    const redirectPath = searchParams.get('redirect') || '/';

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        router.push(redirectPath);
        // No need to call refresh, onAuthStateChange in Header will handle it
      }
    } else { // register
      const { email, password } = values as z.infer<typeof registerSchema>;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userType,
          },
        },
      });
      if (error) {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Successful',
          description: 'Please check your email to verify your account.',
        });
        const loginPath = userType === 'customer' ? '/login' : '/vendor/login';
        router.push(`${loginPath}?redirect=${encodeURIComponent(redirectPath)}`);
      }
    }
    setIsLoading(false);
  };

  const title = `${userType.charAt(0).toUpperCase() + userType.slice(1)} ${mode === 'login' ? 'Login' : 'Sign Up'}`;
  const description = mode === 'login' 
    ? `Welcome back! Please login to your account.`
    : `Create an account to get started.`;
  
  const buttonText = mode === 'login' ? 'Login' : 'Create Account';

  return (
    <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {mode === 'register' && (
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : buttonText}
                </Button>
            </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href={`${userType === 'customer' ? '/register' : '/vendor/register'}?redirect=${encodeURIComponent(searchParams.get('redirect') || '/')}`} className="underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                   <Link href={`${userType === 'customer' ? '/login' : '/vendor/login'}?redirect=${encodeURIComponent(searchParams.get('redirect') || '/')}`} className="underline">
                    Login
                  </Link>
                </>
              )}
            </div>
             <div className="mt-4 text-center text-sm">
                <Link href="/" className="underline text-muted-foreground">
                    Back to home
                </Link>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
