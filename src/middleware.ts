import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase credentials in middleware. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  // Redirect to account setup if user is logged in but profile is incomplete.
  // Do not redirect for the account page itself.
  if (user && !request.nextUrl.pathname.startsWith('/account')) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, address, city, state, pincode, mobile_number')
      .eq('id', user.id)
      .single();

    // PGRST116 means no row was found, which is expected for a new user.
    // We redirect if there's no profile or if any of the essential fields are empty.
    const isProfileIncomplete = !profile || 
                                !profile.full_name ||
                                !profile.address ||
                                !profile.city ||
                                !profile.state ||
                                !profile.pincode ||
                                !profile.mobile_number;

    if (isProfileIncomplete && (error?.code === 'PGRST116' || !error)) {
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
