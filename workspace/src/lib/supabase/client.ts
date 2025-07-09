import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    "https://vllwcuprvvqnsqrbjtkj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbHdjdXBydnZxbnNxcmJqdGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NDk3NTcsImV4cCI6MjA2NzUyNTc1N30.9FGUJ7F70_WFkl37mAwknG-2eNpnzO94T9X4WlP4PQw"
  )
}
