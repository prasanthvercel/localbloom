import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { ExpenseTracker } from '@/components/calculator/ExpenseTracker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cookies } from 'next/headers';

export default async function CalculatorPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  
  if (user.user_metadata?.role !== 'customer') {
    redirect('/');
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

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found
    console.error('Error fetching expenses:', error.message);
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
