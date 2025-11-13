/**
 * Supabase Browser Client
 * Used in Client Components for browser-side operations
 * Uses @supabase/ssr for proper Next.js cookie-based session management
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read cookie from browser
          if (typeof document === 'undefined') return undefined
          
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(row => row.startsWith(`${name}=`))
          
          if (!cookie) {
            return undefined
          }
          
          // Get everything after the first '=' (don't split by '=' as JWT values can contain '=')
          const value = cookie.substring(name.length + 1)
          const decoded = value ? decodeURIComponent(value) : undefined
          return decoded
        },
        set(name: string, value: string, options: any) {
          // Write cookie to browser with proper options
          if (typeof document === 'undefined') return
          
          let cookie = `${name}=${encodeURIComponent(value)}`
          
          // Add expiration
          if (options.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          
          // Add path (crucial for persistence)
          cookie += `; path=${options.path || '/'}`
          
          // Add SameSite (crucial for cross-origin)
          cookie += `; SameSite=${options.sameSite || 'Lax'}`
          
          // Add Secure in production
          if (options.secure || window.location.protocol === 'https:') {
            cookie += '; Secure'
          }
          
          document.cookie = cookie
        },
        remove(name: string, options: any) {
          // Remove cookie by setting expiration to past
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
}

