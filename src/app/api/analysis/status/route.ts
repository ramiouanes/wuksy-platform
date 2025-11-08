import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configure route for fast polling
export const dynamic = 'force-dynamic'
export const maxDuration = 10

/**
 * API Route: Get Analysis Status
 * 
 * Fast polling endpoint for getting real-time analysis progress.
 * Reads directly from database (same pattern as document processing).
 * 
 * Query Parameters:
 * - analysisId: UUID of the analysis to check
 * 
 * Returns:
 * - status: 'pending' | 'processing' | 'completed' | 'failed'
 * - currentPhase: Current processing phase
 * - currentMessage: Human-readable status message
 * - thoughtProcess: AI reasoning (when available)
 * - details: Additional details
 * - lastUpdate: Timestamp of last update
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const analysisId = url.searchParams.get('analysisId')
    
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing analysisId parameter' },
        { status: 400 }
      )
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    // Get token from authorization header
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    // Create Supabase client
    const supabase = token 
      ? createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
      : createClient(supabaseUrl, supabaseKey)
    
    // Get analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('health_analyses')
      .select('status, last_update_at, processing_completed_at, processing_errors')
      .eq('id', analysisId)
      .single()
    
    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }
    
    // Get processing updates
    const { data: updates, error: updatesError } = await supabase
      .from('analysis_processing_updates')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true })
    
    if (updatesError && !updatesError.message.includes('relation') && !updatesError.message.includes('does not exist')) {
      console.error('Error fetching updates:', updatesError)
    }
    
    // Get latest update
    const latestUpdate = updates?.[updates.length - 1]
    
    // Find the latest update with thoughtProcess (for AI reasoning display)
    const latestThoughtUpdate = updates?.reverse().find(u => u.details?.thoughtProcess)
    const thoughtProcess = latestThoughtUpdate?.details?.thoughtProcess
    
    console.log(`[analysis-status] Analysis ${analysisId}: ${analysis.status}, Latest phase: ${latestUpdate?.phase}, Has thoughtProcess: ${!!thoughtProcess}`)
    
    return NextResponse.json({
      status: analysis.status,
      currentPhase: latestUpdate?.phase,
      currentMessage: latestUpdate?.message || getDefaultMessageForStatus(analysis.status),
      thoughtProcess,
      details: latestUpdate?.details || {},
      lastUpdate: latestUpdate?.created_at,
      analysisId
    })
    
  } catch (error) {
    console.error('❌ [Web API] Status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getDefaultMessageForStatus(status: string): string {
  const statusMessages: Record<string, string> = {
    'pending': 'Waiting to start...',
    'processing': 'Analyzing biomarkers...',
    'completed': 'Analysis complete!',
    'failed': 'Analysis failed'
  }
  return statusMessages[status] || 'Processing...'
}



