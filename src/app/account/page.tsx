import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AccountForm } from '@/components/account/AccountForm';
import { Header } from '@/components/Header';
import { cookies } from 'next/headers';

export default async function AccountPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found
    // Don't log error in production
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AccountForm user={user} profile={profile} />
      </main>
    </div>
  );
}
