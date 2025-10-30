import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get user with profile and related data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        user_demographic_profiles(*)
      `)
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's documents count
    const { count: documentsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    // Get user's analyses count
    const { count: analysesCount } = await supabase
      .from('health_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    return NextResponse.json({
      user,
      stats: {
        documents: documentsCount || 0,
        analyses: analysesCount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching user detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

