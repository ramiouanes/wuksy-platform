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
 * - progress: Progress percentage (0-100)
 * - currentPhase: Current processing phase
 * - currentMessage: Human-readable status message
 * - thoughtProcess: AI reasoning (when available)
 * - details: Additional details
 * - lastUpdate: Timestamp of last update
 * - updates: Array of all processing updates
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const analysisId = url.searchParams.get('analysisId')
    
    console.log('🔍 [Analysis Status API] Request for analysisId:', analysisId)
    
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
    
    console.log('📊 [Analysis Status API] Analysis record:', { 
      found: !!analysis, 
      status: analysis?.status,
      error: analysisError?.message 
    })
    
    if (analysisError || !analysis) {
      console.error('❌ [Analysis Status API] Analysis not found:', analysisError)
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
    
    console.log('📝 [Analysis Status API] Processing updates:', {
      count: updates?.length || 0,
      error: updatesError?.message,
      latestPhase: updates?.[updates.length - 1]?.phase
    })
    
    if (updatesError && !updatesError.message.includes('relation') && !updatesError.message.includes('does not exist')) {
      console.error('Error fetching updates:', updatesError)
    }
    
    // Get latest update
    const latestUpdate = updates?.[updates.length - 1]
    
    // Calculate progress from phase (same as document processing)
    const progress = calculateProgressFromPhase(latestUpdate?.phase || analysis.status)
    
    // Find the latest update with thoughtProcess (for AI reasoning display)
    const latestThoughtUpdate = updates?.slice().reverse().find(u => u.details?.thoughtProcess)
    const thoughtProcess = latestThoughtUpdate?.details?.thoughtProcess
    
    const responseData = {
      status: analysis.status,
      progress, // ADD THIS - was missing!
      currentPhase: latestUpdate?.phase || analysis.status,
      currentMessage: latestUpdate?.message || getDefaultMessageForStatus(analysis.status),
      thoughtProcess,
      details: latestUpdate?.details || {},
      lastUpdate: latestUpdate?.created_at,
      analysisId,
      updates: updates || []
    }
    
    console.log('✅ [Analysis Status API] Returning:', {
      status: responseData.status,
      progress: responseData.progress,
      currentPhase: responseData.currentPhase,
      currentMessage: responseData.currentMessage,
      hasThoughtProcess: !!responseData.thoughtProcess,
      updatesCount: updates?.length || 0
    })
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('❌ [Analysis Status API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateProgressFromPhase(phase?: string): number {
  const phaseProgress: Record<string, number> = {
    'pending': 0,
    'queued': 5,
    'initialization': 10,
    'data_fetching': 20,
    'pattern_analysis': 30,
    'reasoning': 60,
    'generating': 80,
    'saving_analysis': 90,
    'saving_supplements': 93,
    'saving_diet': 96,
    'saving_lifestyle': 98,
    'complete': 100,
    'completed': 100,
    'error': 0,
    'failed': 0
  }
  return phaseProgress[phase || ''] || 0
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



