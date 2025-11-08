import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

/**
 * GET /api/analysis/[id]/supplements
 * 
 * Fetch detailed supplement recommendations for an analysis
 * Part of Hybrid approach - loads full details on demand
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analysisId } = await params
    
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Verify user owns this analysis
    const { data: analysis } = await userSupabase
      .from('health_analyses')
      .select('id, user_id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Fetch detailed supplement recommendations
    const { data: supplements, error: supplementsError } = await userSupabase
      .from('supplement_recommendations')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (supplementsError) {
      console.error('Error fetching supplements:', supplementsError)
      return NextResponse.json(
        { error: 'Failed to fetch supplement recommendations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      supplements: supplements || []
    })

  } catch (error) {
    console.error('Fetch supplements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

