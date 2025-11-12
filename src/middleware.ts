import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// SECURE BY DEFAULT: Only these routes are accessible without admin authentication
// Everything else requires the admin password
const PUBLIC_ROUTES = [
  '/',                    // Root redirects to coming-soon
  '/coming-soon',         // Public landing page
  '/admin/login',         // Admin login page
  '/api/subscribe',       // Email subscription endpoint
  '/api/admin/login',     // Admin login endpoint
  '/api/admin/logout',    // Admin logout endpoint  
  '/api/admin/check',     // Admin auth check endpoint
  '/auth/signin',         // User signin page
  '/auth/signup',         // User signup page
  '/auth/callback',       // OAuth callback
  '/how-it-works',        // Public info page
  '/biomarkers',          // Public info page
]

// Protected admin routes that require authentication
const ADMIN_ROUTES = [
  '/admin',               // Admin dashboard
  '/api/admin/stats',     // Admin stats
  '/api/admin/users',     // Admin users
  '/api/admin/subscribers', // Admin subscribers
  '/api/admin/documents', // Admin documents
  '/api/admin/analyses',  // Admin analyses
  '/api/admin/biomarkers', // Admin biomarkers
  '/api/admin/export',    // Admin export
]

// Static assets and Next.js internal routes (don't check these)
const STATIC_ASSETS_PATTERNS = [
  '/_next/',
  '/favicon.ico',
  '/logo.svg',
  '/api/_next/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and Next.js internals
  if (STATIC_ASSETS_PATTERNS.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next()
  }

  // Update Supabase session (CRITICAL - refreshes auth tokens)
  const { supabaseResponse, user } = await updateSession(request)

  // Allow explicitly public routes (but still refresh session if exists)
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  if (isPublicRoute) {
    return supabaseResponse
  }

  // Check for Bearer token authentication (for mobile app API access)
  // If a valid Bearer token is present, let the API route handle JWT validation
  const authHeader = request.headers.get('authorization')
  const hasBearerToken = authHeader?.startsWith('Bearer ')
  
  if (hasBearerToken && pathname.startsWith('/api/')) {
    // Has Bearer token - allow through to API route for JWT validation
    // The API routes will validate the Supabase JWT token
    return supabaseResponse
  }

  // Check if this is an admin route
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')
  
  if (isAdminRoute) {
    // Admin routes require authentication
    const adminAuth = request.cookies.get('admin-auth')
    
    if (!adminAuth || adminAuth.value !== 'true') {
      // Not authenticated - redirect to admin login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Admin authentication required' },
          { status: 401 }
        )
      }
      
      // Redirect to admin login page
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // Authenticated - allow access
    return supabaseResponse
  }

  // For user app routes (dashboard, documents, etc.) - check Supabase session OR admin auth
  // Admin auth cookie also grants access to user routes
  const adminAuth = request.cookies.get('admin-auth')
  const hasAdminAccess = adminAuth?.value === 'true'

  if (!user && !hasAdminAccess) {
    // Not authenticated - no Supabase session and no admin access
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // For page routes, redirect to signin
    const signInUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated (either as user or admin) - allow access
  return supabaseResponse
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

