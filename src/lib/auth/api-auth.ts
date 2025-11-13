/**
 * Unified API Authentication Helper
 * Consistent auth handling for all API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User
  supabase: any
}

export interface AuthError {
  error: string
}

/**
 * Get authenticated user from API request
 * Extracts Bearer token from Authorization header and validates it
 * Returns user and authenticated Supabase client
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return { error: 'No authorization header provided' }
    }

    const token = authorization.replace('Bearer ', '')
    
    if (!token) {
      return { error: 'Invalid authorization token' }
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return { error: 'Server configuration error' }
    }

    // Create authenticated Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { error: error?.message || 'Invalid or expired token' }
    }

    return { user, supabase }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed' }
  }
}

/**
 * Check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result
}

/**
 * Helper for consistent unauthorized responses
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Helper for consistent error responses
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

