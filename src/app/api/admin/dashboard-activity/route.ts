import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    // Get recent activity across different tables
    const [
      { data: recentSubscribers },
      { data: recentUsers },
      { data: recentDocuments },
      { data: recentAnalyses }
    ] = await Promise.all([
      supabase
        .from('email_subscriptions')
        .select('email, subscribed_at, status')
        .gte('subscribed_at', startDateStr)
        .order('subscribed_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('users')
        .select('email, name, created_at')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('documents')
        .select('filename, uploaded_at, status, users(email)')
        .gte('uploaded_at', startDateStr)
        .order('uploaded_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('health_analyses')
        .select('created_at, overall_health_score, health_category, users(email)')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Combine and sort all activities by date
    const allActivities = [
      ...(recentSubscribers || []).map(s => ({
        type: 'subscription',
        date: s.subscribed_at,
        details: { email: s.email, status: s.status }
      })),
      ...(recentUsers || []).map(u => ({
        type: 'user_registration',
        date: u.created_at,
        details: { name: u.name, email: u.email }
      })),
      ...(recentDocuments || []).map(d => ({
        type: 'document_upload',
        date: d.uploaded_at,
        details: { filename: d.filename, status: d.status, user: d.users?.email }
      })),
      ...(recentAnalyses || []).map(a => ({
        type: 'health_analysis',
        date: a.created_at,
        details: { 
          score: a.overall_health_score, 
          category: a.health_category,
          user: a.users?.email 
        }
      }))
    ]

    // Sort by date (most recent first)
    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Take top 20 activities
    const topActivities = allActivities.slice(0, 20)

    return NextResponse.json({
      activities: topActivities,
      summary: {
        totalActivities: allActivities.length,
        newSubscribers: recentSubscribers?.length || 0,
        newUsers: recentUsers?.length || 0,
        newDocuments: recentDocuments?.length || 0,
        newAnalyses: recentAnalyses?.length || 0
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

