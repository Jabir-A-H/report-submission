import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth token on every request to prevent expiry
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle legacy/removed /login and /register paths explicitly by redirecting to unified /home portal
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
    const url = request.nextUrl.clone()
    if (user && request.nextUrl.pathname.startsWith('/login')) {
      url.pathname = '/'
    } else {
      url.pathname = '/home'
      if (request.nextUrl.pathname.startsWith('/register')) {
        url.searchParams.set('mode', 'register')
      }
    }
    return NextResponse.redirect(url)
  }

  // Public routes that don't require authentication
  const publicPaths = ['/home', '/auth', '/pending-approval', '/forgot-password', '/update-password']
  const isPublicRoute = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )

  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // Redirect unauthenticated users away from protected routes uniformly to /home
  if (!user && !isPublicRoute) {
    // For API routes, return 401 JSON instead of redirect
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    url.search = ""
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check if they are active (approved)
  if (user && !isPublicRoute && !isApiRoute) {
    const { data: person } = await supabase
      .from('people')
      .select('active')
      .eq('supabase_uid', user.id)
      .single()

    // Treat both missing people rows (orphaned auth account) AND
    // inactive=false the same way — send to pending-approval.
    if (!person || person.active === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/pending-approval'
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  // If user is authenticated and hitting /home, redirect to main dashboard (/)
  if (user && request.nextUrl.pathname === '/home') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, etc
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
