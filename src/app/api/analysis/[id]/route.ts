import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params promise
    const { id: analysisId } = await params
    
    // Get the authenticated user using server-side auth
    const { user, error: authError } = await getAuthenticatedUser(request)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const userSupabase = createClient(supabaseUrl!, supabaseKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Get analysis from database
    const { data: analysis, error: analysisError } = await userSupabase
      .from('health_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Get related biomarker readings with detailed biomarker info (LEFT JOIN to include all readings)
    const { data: biomarkerReadings } = await userSupabase
      .from('biomarker_readings')
      .select(`
        *,
        biomarkers (
          id,
          name,
          description,
          clinical_significance,
          conventional_min,
          conventional_max,
          unit,
          category,
          subcategory
        )
      `)
      .eq('analysis_id', analysisId)

    // Get biomarker optimal ranges for all biomarkers in this analysis (only for those with biomarker_id)
    const biomarkerIds = biomarkerReadings?.map(reading => reading.biomarkers?.id).filter(Boolean) || []
    
    let optimalRanges: any[] = []
    let scientificRefs: any[] = []
    
    // Only fetch additional data if we have biomarker IDs
    if (biomarkerIds.length > 0) {
      const { data: ranges } = await userSupabase
        .from('biomarker_optimal_ranges')
        .select(`
          *,
          biomarkers!inner (id, name)
        `)
        .in('biomarker_id', biomarkerIds)
        .eq('is_active', true)
      
      optimalRanges = ranges || []

      // Get scientific references for biomarkers
      const { data: refs } = await userSupabase
        .from('biomarker_reference_links')
        .select(`
          biomarker_id,
          link_type,
          relevance_score,
          scientific_references!inner (
            id,
            title,
            authors,
            journal,
            publication_year,
            pubmed_id,
            doi,
            url,
            study_type,
            evidence_quality,
            key_findings,
            abstract
          )
        `)
        .in('biomarker_id', biomarkerIds)
        .eq('is_active', true)
        .order('relevance_score', { ascending: false })
      
      scientificRefs = refs || []
    }

    // Organize data by biomarker
    const biomarkerData = biomarkerReadings?.map(reading => ({
      ...reading,
      optimal_ranges: optimalRanges?.filter(range => range.biomarker_id === reading.biomarkers?.id) || [],
      scientific_references: scientificRefs?.filter(ref => ref.biomarker_id === reading.biomarkers?.id) || []
    })) || []

    // Group biomarkers by category
    const biomarkersByCategory = biomarkerData.reduce((acc, biomarker) => {
      const category = biomarker.biomarkers?.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(biomarker)
      return acc
    }, {} as Record<string, typeof biomarkerData>)


    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        biomarker_readings: biomarkerData,
        biomarkers_by_category: biomarkersByCategory
      }
    })

  } catch (error) {
    console.error('Fetch analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 