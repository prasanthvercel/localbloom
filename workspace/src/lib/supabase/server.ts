import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, type ReadonlyRequestCookies } from 'next/headers'

export const createClient = (cookieStore: ReadonlyRequestCookies) => {
  return createServerClient(
    "https://vllwcuprvvqnsqrbjtkj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbHdjdXBydnZxbnNxcmJqdGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NDk3NTcsImV4cCI6MjA2NzUyNTc1N30.9FGUJ7F70_WFkl37mAwknG-2eNpnzO94T9X4WlP4PQw",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
