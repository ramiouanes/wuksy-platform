import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    
    const supabase = createAdminClient()
    
    let query = supabase
      .from('email_subscriptions')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: subscribers, error, count } = await query

    if (error) {
      console.error('Error fetching subscribers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin subscribers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { subscriberId } = await request.json()

    if (!subscriberId) {
      return NextResponse.json(
        { error: 'Subscriber ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('email_subscriptions')
      .delete()
      .eq('id', subscriberId)

    if (error) {
      console.error('Error deleting subscriber:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscriber' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin subscriber delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { subscriberId, status } = await request.json()

    if (!subscriberId || !status) {
      return NextResponse.json(
        { error: 'Subscriber ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('email_subscriptions')
      .update({ status })
      .eq('id', subscriberId)

    if (error) {
      console.error('Error updating subscriber:', error)
      return NextResponse.json(
        { error: 'Failed to update subscriber' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin subscriber update error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscriber' },
      { status: 500 }
    )
  }
}

