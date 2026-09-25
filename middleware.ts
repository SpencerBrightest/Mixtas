// Next.js middleware for refreshing Supabase auth sessions and protecting admin routes.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Refreshes auth tokens on every request and guards /admin routes behind a valid session. */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  // If Supabase keys are not yet configured, allow request to proceed cleanly
  if (!url || !key) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh session tokens
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isLoginRoute = request.nextUrl.pathname === '/admin/login'

    // Admin routes require an active Supabase session. No cookie bypass.
    if (isAdminRoute && !isLoginRoute && !user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }

    // If user is already logged in and visits /admin/login, redirect to dashboard
    if (isLoginRoute && user) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/admin'
      return NextResponse.redirect(dashboardUrl)
    }
  } catch (error) {
    console.error('Middleware Supabase session error:', error)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run middleware on all routes except static assets and API webhooks
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|api/webhooks).*)',
  ],
}
