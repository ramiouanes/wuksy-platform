import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: subscriber, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscriber })
  } catch (error) {
    console.error('Error fetching subscriber detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriber details' },
      { status: 500 }
    )
  }
}

