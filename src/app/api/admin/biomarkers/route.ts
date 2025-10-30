import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    
    const supabase = createAdminClient()
    
    let query = supabase
      .from('biomarkers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: biomarkers, error, count } = await query

    if (error) {
      console.error('Error fetching biomarkers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch biomarkers' },
        { status: 500 }
      )
    }

    // Get unique categories
    const { data: allBiomarkers } = await supabase
      .from('biomarkers')
      .select('category')
      .not('category', 'is', null)

    const categories = Array.from(new Set(allBiomarkers?.map(b => b.category) || []))

    return NextResponse.json({
      biomarkers: biomarkers || [],
      categories: categories.filter(Boolean),
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin biomarkers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch biomarkers' },
      { status: 500 }
    )
  }
}

