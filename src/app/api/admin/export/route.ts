import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'subscribers'
    
    const supabase = createAdminClient()
    
    let data: any[] = []
    let filename = 'export.csv'

    switch (type) {
      case 'subscribers':
        const { data: subscribers } = await supabase
          .from('email_subscriptions')
          .select('*')
          .order('subscribed_at', { ascending: false })
        
        data = subscribers || []
        filename = `subscribers_${new Date().toISOString().split('T')[0]}.csv`
        
        // Convert to CSV
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',')
          const rows = data.map(row => 
            Object.values(row).map(val => 
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          )
          const csv = [headers, ...rows].join('\n')
          
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }
        break

      case 'users':
        const { data: users } = await supabase
          .from('users')
          .select('id, email, name, created_at, last_login_at, data_consent, research_consent')
          .order('created_at', { ascending: false })
        
        data = users || []
        filename = `users_${new Date().toISOString().split('T')[0]}.csv`
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',')
          const rows = data.map(row => 
            Object.values(row).map(val => 
              typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
          )
          const csv = [headers, ...rows].join('\n')
          
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        )
    }

    // If no data
    return NextResponse.json(
      { error: 'No data to export' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Admin export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

