import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get the authorization header
    const authorization = request.headers.get('authorization')
    
    if (!authorization) {
      return { user: null, error: 'No authorization header' }
    }

    // Extract the access token from Bearer token
    const token = authorization.replace('Bearer ', '')
    
    if (!token) {
      return { user: null, error: 'No token found' }
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return { user: null, error: 'Missing Supabase configuration' }
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Get the user from the token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Alternative approach using a test user ID
export async function getTestUser() {
  return {
    id: 'test-user-123',
    email: 'test@wuksy.com',
    name: 'Test User',
    data_consent: true,
    research_consent: false
  }
} 