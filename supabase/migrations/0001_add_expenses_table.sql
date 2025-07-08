-- Create the expenses table
CREATE TABLE public.expenses (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    expense_date date NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comments to the table and columns
COMMENT ON TABLE public.expenses IS 'Stores expense records for users.';
COMMENT ON COLUMN public.expenses.user_id IS 'Links to the user who owns the expense.';
COMMENT ON COLUMN public.expenses.item_name IS 'Name of the expense item (e.g., "Groceries", "Coffee").';
COMMENT ON COLUMN public.expenses.amount IS 'Cost of the expense item.';
COMMENT ON COLUMN public.expenses.expense_date IS 'The date the expense was incurred.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- 1. Allow users to insert their own expenses
CREATE POLICY "Users can insert their own expenses"
ON public.expenses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to view their own expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses
FOR SELECT USING (auth.uid() = user_id);

-- 3. Allow users to update their own expenses
CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Allow users to delete their own expenses
CREATE POLICY "Users can delete their own expenses"
ON public.expenses
FOR DELETE USING (auth.uid() = user_id);
