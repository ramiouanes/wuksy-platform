import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Create a public Supabase client since biomarkers reference data is public
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing required configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active biomarkers with their details
    const { data: biomarkers, error: biomarkersError } = await supabase
      .from('biomarkers')
      .select(`
        id,
        name,
        aliases,
        category,
        subcategory,
        unit,
        conventional_min,
        conventional_max,
        description,
        improved_description,
        clinical_significance,
        formula,
        source,
        source_url,
        extraction_version,
        last_verified,
        related_biomarkers,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (biomarkersError) {
      console.error('Error fetching biomarkers:', biomarkersError)
      return NextResponse.json(
        { error: 'Failed to fetch biomarkers' },
        { status: 500 }
      )
    }

    if (!biomarkers || biomarkers.length === 0) {
      return NextResponse.json(
        { biomarkers: [], message: 'No biomarkers found' },
        { status: 200 }
      )
    }

    // Get biomarker IDs for fetching related data
    const biomarkerIds = biomarkers.map((b: any) => b.id)

    // Get optimal ranges for all biomarkers
    const { data: optimalRanges, error: rangesError } = await supabase
      .from('biomarker_optimal_ranges')
      .select(`
        id,
        biomarker_id,
        gender,
        age_min,
        age_max,
        menstrual_phase,
        pregnancy_status,
        additional_criteria,
        optimal_min,
        optimal_max,
        functional_min,
        functional_max,
        range_type,
        confidence_level,
        population_studied,
        scientific_references,
        evidence_level,
        is_primary,
        usage_notes,
        last_updated
      `)
      .in('biomarker_id', biomarkerIds)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })

    if (rangesError) {
      console.error('Error fetching optimal ranges:', rangesError)
    }

    // Get scientific references for biomarkers
    const { data: scientificRefs, error: refsError } = await supabase
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

    if (refsError) {
      console.error('Error fetching scientific references:', refsError)
    }

    // Combine all data
    const enrichedBiomarkers = biomarkers.map((biomarker: any) => {
      const biomarkerOptimalRanges = optimalRanges?.filter(
        (range: any) => range.biomarker_id === biomarker.id
      ) || []

      const biomarkerScientificRefs = scientificRefs?.filter(
        (ref: any) => ref.biomarker_id === biomarker.id
      ) || []

      return {
        ...biomarker,
        optimal_ranges: biomarkerOptimalRanges,
        scientific_references: biomarkerScientificRefs.map((ref: any) => ({
          ...ref.scientific_references,
          link_type: ref.link_type,
          relevance_score: ref.relevance_score
        }))
      }
    })

    // Group biomarkers by category for easier frontend handling
    const biomarkersByCategory = enrichedBiomarkers.reduce((acc: any, biomarker: any) => {
      const category = biomarker.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(biomarker)
      return acc
    }, {} as Record<string, typeof enrichedBiomarkers>)

    // Get unique categories for filtering
    const categories = ['All', ...Object.keys(biomarkersByCategory).sort()]

    return NextResponse.json({
      biomarkers: enrichedBiomarkers,
      biomarkers_by_category: biomarkersByCategory,
      categories,
      total_count: enrichedBiomarkers.length,
      metadata: {
        total_biomarkers: enrichedBiomarkers.length,
        biomarkers_with_optimal_ranges: enrichedBiomarkers.filter((b: any) => b.optimal_ranges.length > 0).length,
        biomarkers_with_references: enrichedBiomarkers.filter((b: any) => b.scientific_references.length > 0).length,
        categories_count: categories.length - 1 // Exclude 'All'
      }
    })

  } catch (error) {
    console.error('Unexpected error in biomarkers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
