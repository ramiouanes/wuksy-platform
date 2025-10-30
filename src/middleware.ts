import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and Next.js internals
  if (STATIC_ASSETS_PATTERNS.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next()
  }

  // Allow explicitly public routes
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  if (isPublicRoute) {
    return NextResponse.next()
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
    return NextResponse.next()
  }

  // ALL OTHER ROUTES (app routes) ALSO REQUIRE ADMIN AUTHENTICATION (secure by default)
  // This is secure by default - any new route automatically requires auth
  const adminAuth = request.cookies.get('admin-auth')

  if (!adminAuth || adminAuth.value !== 'true') {
    // Not authenticated
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }
    
    // For page routes, redirect to coming-soon page
    const comingSoonUrl = new URL('/coming-soon', request.url)
    return NextResponse.redirect(comingSoonUrl)
  }

  // Authenticated - allow access
  return NextResponse.next()
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

