-- Drop existing policies to start fresh.
-- We use "IF EXISTS" to avoid errors if policies don't exist.
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can read own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;

-- Enable Row Level Security (RLS) on the tables.
-- This ensures the policies below are actually enforced.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies for the 'profiles' table
-- -----------------------------------------------------------------------------

-- 1. Users can read their own profile.
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Users can create their own profile.
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile.
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- Policies for the 'expenses' table
-- -----------------------------------------------------------------------------

-- 1. Users can read their own expenses.
CREATE POLICY "Users can read own expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can add their own expenses.
CREATE POLICY "Users can insert own expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own expenses.
CREATE POLICY "Users can delete own expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
