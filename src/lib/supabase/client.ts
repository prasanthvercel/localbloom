import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are not set in .env file. Using placeholder values. The app will render, but database features will not work until you provide your credentials.');
    supabaseUrl = 'http://localhost:54321'
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
