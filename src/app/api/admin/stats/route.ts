import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Fetch counts from all major tables
    const [
      usersCount,
      subscribersCount,
      documentsCount,
      biomarkersCount,
      analysesCount,
      biomarkerReadingsCount
    ] = await Promise.all([
      // Users count
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
      
      // Email subscribers count
      supabase
        .from('email_subscriptions')
        .select('*', { count: 'exact', head: true }),
      
      // Documents count
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true }),
      
      // Biomarkers count
      supabase
        .from('biomarkers')
        .select('*', { count: 'exact', head: true }),
      
      // Health analyses count
      supabase
        .from('health_analyses')
        .select('*', { count: 'exact', head: true }),
      
      // Biomarker readings count
      supabase
        .from('biomarker_readings')
        .select('*', { count: 'exact', head: true })
    ])

    // Get recent activity
    const { data: recentUsers } = await supabase
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: recentSubscribers } = await supabase
      .from('email_subscriptions')
      .select('subscribed_at')
      .order('subscribed_at', { ascending: false })
      .limit(10)

    const { data: recentDocuments } = await supabase
      .from('documents')
      .select('uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: {
        totalUsers: usersCount.count || 0,
        totalSubscribers: subscribersCount.count || 0,
        totalDocuments: documentsCount.count || 0,
        totalBiomarkers: biomarkersCount.count || 0,
        totalAnalyses: analysesCount.count || 0,
        totalBiomarkerReadings: biomarkerReadingsCount.count || 0,
      },
      recentActivity: {
        users: recentUsers || [],
        subscribers: recentSubscribers || [],
        documents: recentDocuments || []
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}

