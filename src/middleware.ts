import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options, })
          response = NextResponse.next({ request: { headers: request.headers, }, })
          response.cookies.set({ name, value, ...options, })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options, })
          response = NextResponse.next({ request: { headers: request.headers, }, })
          response.cookies.set({ name, value: '', ...options, })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to account setup if user is new and hasn't set up their profile
  if (user && !request.nextUrl.pathname.startsWith('/account')) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Redirect if profile is missing, incomplete, or if there's a "not found" error.
    if ((!profile || !profile.full_name) && (error?.code === 'PGRST116' || !error)) {
       const url = request.nextUrl.clone()
       url.pathname = '/account'
       return NextResponse.redirect(url)
    }
  }


  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth routes (login, register)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|vendor/login|vendor/register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
