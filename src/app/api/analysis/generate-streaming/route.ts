import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

// Configure route for triggering background analysis
export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Just triggering the edge function, no long processing

/**
 * API Route: Generate Analysis (Fire and Forget)
 * 
 * This route creates the analysis record and triggers the edge function in the background.
 * Pattern: Same as document processing - fire and forget!
 * Mobile/web can then poll /api/analysis/status for updates.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get the authenticated user
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

    // 2. Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // 3. Create user Supabase client to verify document ownership
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    // 4. Verify document ownership and has biomarkers
    const { data: document, error: docError } = await userSupabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
    
    if (docError || !document) {
      console.error('❌ [Web API] Document not found:', docError)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 5. Create health_analyses record (with service role to bypass RLS)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: analysis, error: analysisError } = await serviceSupabase
      .from('health_analyses')
      .insert({
        user_id: user.id,
        document_id: documentId,
        status: 'pending',
        biomarker_insights: []  // Required NOT NULL field
      })
      .select()
      .single()
    
    if (analysisError || !analysis) {
      console.error('❌ [Web API] Failed to create analysis:', analysisError)
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    const analysisId = analysis.id
    console.log('✅ [Web API] Created analysis record:', analysisId)

    // 6. Trigger Supabase Edge Function (fire and forget - don't await!)
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/analyze-biomarkers`
    
    console.log('🚀 [Web API] Triggering edge function (fire and forget):', edgeFunctionUrl)
    console.log('📊 [Web API] Analysis ID:', analysisId, 'Document ID:', documentId, 'User ID:', user.id)
    
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        documentId, 
        userId: user.id,
        analysisId  // Pass the analysisId so edge function doesn't create a new one
      })
    }).catch(error => {
      console.error('❌ [Web API] Failed to trigger edge function:', error)
      // Don't throw - analysis record is created, client can poll for status
    })
    
    // 7. Return immediately (don't wait for analysis to complete!)
    console.log('✅ [Web API] Returning immediately with analysisId:', analysisId)
    
    return NextResponse.json({
      success: true,
      message: 'Analysis started',
      analysisId,
      status: 'pending'
    }, { status: 202 })  // 202 Accepted - processing in background

  } catch (error) {
    console.error('❌ [Web API] Analysis generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 