import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require admin authentication
const ADMIN_PROTECTED_ROUTES = [
  '/app',
  '/dashboard',
  '/upload',
  '/documents',
  '/analysis',
  '/profile',
  '/biomarkers',
  '/how-it-works',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
]

// Public routes that don't require admin authentication
const PUBLIC_ROUTES = [
  '/',
  '/coming-soon',
  '/admin/login',
  '/api/subscribe',
  '/api/admin/login',
  '/api/admin/logout',
  '/api/admin/check',
  '/_next',
  '/favicon.ico',
  '/logo.svg',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route needs admin protection
  const needsAdminAuth = ADMIN_PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  if (needsAdminAuth) {
    // Check for admin auth cookie
    const adminAuth = request.cookies.get('admin-auth')

    if (!adminAuth || adminAuth.value !== 'true') {
      // Redirect to admin login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

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

