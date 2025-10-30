import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabase = createAdminClient()
    
    let query = supabase
      .from('health_analyses')
      .select(`
        *,
        users(email, name),
        documents(filename)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: analyses, error, count } = await query

    if (error) {
      console.error('Error fetching analyses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analyses: analyses || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin analyses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { analysisId } = await request.json()

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('health_analyses')
      .delete()
      .eq('id', analysisId)

    if (error) {
      console.error('Error deleting analysis:', error)
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin analysis delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete analysis' },
      { status: 500 }
    )
  }
}

