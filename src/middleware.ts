/**
 * Next.js Middleware for Admin Route Protection
 * Protects admin routes and API endpoints with authentication and authorization
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Admin routes that require authentication
const ADMIN_ROUTES = ['/admin']
const ADMIN_API_ROUTES = ['/api/admin']

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/about',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms'
]

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client
  const supabase = createMiddlewareClient({ req: request, res })
  
  const pathname = request.nextUrl.pathname
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
  const isAdminAPIRoute = ADMIN_API_ROUTES.some(route => pathname.startsWith(route))
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
  
  // Skip middleware for static files and API routes that aren't admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    (pathname.startsWith('/api') && !isAdminAPIRoute)
  ) {
    return res
  }
  
  try {
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error in middleware:', sessionError)
      if (isAdminRoute || isAdminAPIRoute) {
        return redirectToLogin(request)
      }
      return res
    }
    
    // Handle admin routes
    if (isAdminRoute || isAdminAPIRoute) {
      // Check if user is authenticated
      if (!session) {
        if (isAdminAPIRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return redirectToLogin(request)
      }
      
      // Check admin status in database
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('role, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single()
        
        if (adminError || !adminData) {
          console.log('User not found in admin_users table:', session.user.email)
          
          if (isAdminAPIRoute) {
            return new NextResponse(
              JSON.stringify({ error: 'Admin privileges required' }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            )
          }
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
        
        // User is valid admin - add headers for use in components
        res.headers.set('x-user-id', session.user.id)
        res.headers.set('x-user-email', session.user.email || '')
        res.headers.set('x-admin-role', adminData.role)
        res.headers.set('x-is-admin', 'true')
        
        // Update last login time (fire and forget)
        supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', session.user.id)
          .then(() => {})
          .catch(err => console.error('Failed to update last login:', err))
        
        return res
        
      } catch (error) {
        console.error('Error checking admin status in middleware:', error)
        
        if (isAdminAPIRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return NextResponse.redirect(new URL('/error', request.url))
      }
    }
    
    // For non-admin routes, just add session info to headers if available
    if (session) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-email', session.user.email || '')
    }
    
    return res
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    // For admin routes, redirect to error page
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/error', request.url))
    }
    
    // For admin API routes, return error response
    if (isAdminAPIRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return res
  }
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}