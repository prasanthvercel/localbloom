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

  // If a user is logged in, check if their profile is complete.
  if (user) {
    const isVendor = user.user_metadata?.role === 'vendor';
    const currentPath = request.nextUrl.pathname;
    
    // For customers, check their `profiles` table.
    // Skip this check if they are already on the account page or trying to log out.
    if (!isVendor && !currentPath.startsWith('/account') && !currentPath.startsWith('/auth/logout')) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, mobile_number')
        .eq('id', user.id)
        .single();

      const isProfileIncomplete = !profile || !profile.full_name || !profile.mobile_number;

      if (isProfileIncomplete && (error?.code === 'PGRST116' || !error)) {
        const url = request.nextUrl.clone()
        url.pathname = '/account'
        return NextResponse.redirect(url)
      }
    }
    
    // For vendors, check if they have created their shop.
    if (isVendor && !currentPath.startsWith('/vendor/shop') && !currentPath.startsWith('/account')) {
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('name, category, description')
        .eq('user_id', user.id)
        .single();
      
      const isShopProfileIncomplete = !vendor || !vendor.name || !vendor.category || !vendor.description;

      if (isShopProfileIncomplete && (error?.code === 'PGRST116' || !error)) {
         const url = request.nextUrl.clone()
         url.pathname = '/vendor/shop'
         return NextResponse.redirect(url)
      }
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
