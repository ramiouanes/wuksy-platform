import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-server'

// Configure route for streaming
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for Netlify Pro, 10s for free tier

/**
 * API Route: Generate Analysis (Streaming)
 * 
 * This route now proxies requests to the Supabase edge function.
 * The edge function handles all analysis logic for consistency between mobile and web.
 * 
 * Migration: This ensures backwards compatibility while centralizing logic in edge functions.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user using server-side auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      )
    }

    // Forward request to Supabase edge function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-biomarkers`
    
    console.log('🔄 [Web API] Proxying analysis request to edge function:', edgeFunctionUrl)
    console.log('🔄 [Web API] Document ID:', documentId, 'User ID:', user.id)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        documentId, 
        userId: user.id 
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('❌ [Web API] Edge function error:', result)
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: response.status }
      )
    }
    
    console.log('✅ [Web API] Edge function responded:', result)
    
    // Return the result from edge function
    // The edge function returns { success: true, analysisId: string, message: string }
    return NextResponse.json(result, { status: response.status })

  } catch (error) {
    console.error('Analysis generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 