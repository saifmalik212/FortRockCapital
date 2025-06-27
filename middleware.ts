import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/dcf', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // If accessing a protected route
  if (isProtectedRoute) {
    // No session at all - redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user has a profile (our verification method)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    // If profiles table doesn't exist OR any error, fall back to email verification
    if (profileError?.code === '42P01' || 
        profileError?.message?.includes('relation "profiles" does not exist') ||
        !profileError?.code) {
      // Fall back to email verification
      if (!session.user.email_confirmed_at) {
        return NextResponse.redirect(new URL('/verify-email', req.url))
      }
      // Email is confirmed, allow access
    } else if (!profile) {
      // User has session but no profile - needs to complete signup
      return NextResponse.redirect(new URL('/verify-email', req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.includes(req.nextUrl.pathname)
  
  if (isAuthRoute && session) {
    // Check if they have a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    // If profiles table doesn't exist OR any error, use email verification
    if (profileError?.code === '42P01' || 
        profileError?.message?.includes('relation "profiles" does not exist') ||
        !profileError?.code) {
      // If email is confirmed, redirect to dcf
      if (session.user.email_confirmed_at) {
        return NextResponse.redirect(new URL('/dcf', req.url))
      }
      // If email not confirmed, let them stay on auth pages
    } else if (profile) {
      // If they have a profile, redirect to dashboard
      return NextResponse.redirect(new URL('/dcf', req.url))
    }
    // If no profile, let them stay on auth pages to complete signup
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 