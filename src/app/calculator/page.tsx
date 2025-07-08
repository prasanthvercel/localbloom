import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { ExpenseTracker } from '@/components/calculator/ExpenseTracker';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default async function CalculatorPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const today = new Date();
  const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    // Continue with an empty array if there's an error
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseTracker user={user} initialExpenses={expenses || []} />
      </main>
    </div>
  );
}
