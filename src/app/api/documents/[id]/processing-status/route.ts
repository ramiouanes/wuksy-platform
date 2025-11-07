import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

// Configure route
export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    // Create user Supabase client
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }
    
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    // Get document
    const { data: document, error: docError } = await userSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()
    
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Get processing updates
    const { data: updates, error: updatesError } = await userSupabase
      .from('document_processing_updates')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
    
    // If there's an error and it's not "relation does not exist", return error
    if (updatesError && !updatesError.message.includes('relation') && !updatesError.message.includes('does not exist')) {
      console.error('Error fetching updates:', updatesError)
    }
    
    // Calculate progress from phase
    const latestUpdate = updates?.[updates.length - 1]
    const progress = calculateProgressFromPhase(latestUpdate?.phase || document.status)
    
    return NextResponse.json({
      status: document.status,
      progress,
      currentPhase: latestUpdate?.phase || document.status,
      currentMessage: latestUpdate?.message || getDefaultMessageForStatus(document.status),
      updates: updates || [],
      document: {
        id: document.id,
        filename: document.filename,
        processed_at: document.processed_at,
        processing_started_at: document.processing_started_at,
        processing_completed_at: document.processing_completed_at
      }
    })
    
  } catch (error) {
    console.error('Status fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}

function calculateProgressFromPhase(phase?: string): number {
  const phaseProgress: Record<string, number> = {
    'pending': 0,
    'queued': 5,
    'validation': 10,
    'download': 20,
    'ocr': 40,
    'ai_extraction': 70,
    'saving': 90,
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
    'queued': 'Queued for processing...',
    'processing': 'Processing document...',
    'completed': 'Processing complete!',
    'failed': 'Processing failed',
    'error': 'An error occurred'
  }
  return statusMessages[status] || 'Processing...'
}

