import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        // User profile will be automatically created by database trigger if it doesn't exist
        // No need to manually create the user profile here
        return NextResponse.redirect(new URL(next, request.url))
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // Redirect to sign in page if there's an error
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
