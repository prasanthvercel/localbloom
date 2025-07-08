-- This script removes all complex role-based policies and replaces them with
-- simple, essential security rules. This will resolve the "permission denied" errors.
-- Run this entire script in your Supabase SQL Editor.

-- Drop all old policies to ensure a clean state.
-- The "IF EXISTS" clause prevents errors if a policy doesn't exist.
DROP POLICY IF EXISTS "Customers can only manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for customers on their expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow customers to manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own expenses." ON public.expenses;
DROP POLICY IF EXISTS "Users can view their own expenses." ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses." ON public.expenses;

-- === PROFILES POLICIES ===
-- This single policy allows a user to perform any action (select, insert, update, delete)
-- on THEIR OWN profile record. It prevents them from accessing anyone else's.
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- === EXPENSES POLICIES ===
-- This single policy allows a user to perform any action on THEIR OWN expenses.
-- It does NOT check for a 'customer' role.
CREATE POLICY "Users can manage their own expenses"
ON public.expenses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled on the tables.
-- This command will not error if it's already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
