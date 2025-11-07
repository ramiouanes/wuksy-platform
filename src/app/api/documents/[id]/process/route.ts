import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

// Configure route for triggering background processing
export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Just triggering the edge function, no long processing

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Get document ID
    const { id: documentId } = await params
    
    // 2. Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 3. Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    // 4. Create user Supabase client to verify document ownership
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }
    
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    // 5. Verify document ownership
    const { data: document, error: docError } = await userSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // 6. Update status to queued
    await userSupabase
      .from('documents')
      .update({ 
        status: 'queued',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    // 7. Trigger Supabase Edge Function (don't await - fire and forget)
    fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId, userId: user.id })
    }).catch(error => {
      console.error('Failed to trigger edge function:', error)
    })
    
    // 8. Return immediately (don't wait for processing)
    return NextResponse.json({
      success: true,
      message: 'Processing started',
      documentId,
      status: 'queued'
    }, { status: 202 })
    
  } catch (error) {
    console.error('Queue error:', error)
    return NextResponse.json({ error: 'Failed to queue processing' }, { status: 500 })
  }
}
