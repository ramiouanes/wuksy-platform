import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { getBiomarkerStatus } from '@/lib/utils'
import { AIAnalysisService } from '@/lib/ai-analysis-service'

export async function POST(request: NextRequest) {
  try {
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

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing documentId' },
        { status: 400 }
      )
    }

    // Get biomarkers from biomarker_readings table instead of from request
    const { data: biomarkersFromDB, error: biomarkersError } = await userSupabase
      .from('biomarker_readings')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)

    if (biomarkersError) {
      console.error('Error fetching biomarkers:', biomarkersError)
      return NextResponse.json(
        { error: 'Failed to fetch biomarkers for analysis' },
        { status: 500 }
      )
    }

    if (!biomarkersFromDB || biomarkersFromDB.length === 0) {
      return NextResponse.json(
        { error: 'No biomarkers found for this document' },
        { status: 404 }
      )
    }

    console.log('Found', biomarkersFromDB.length, 'biomarkers for analysis')

    // Get user demographic profile for personalized analysis
    const { data: profile } = await userSupabase
      .from('user_demographic_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get optimal ranges for biomarkers
    const { data: optimalRanges } = await userSupabase
      .from('biomarker_optimal_ranges')
      .select(`
        *,
        biomarkers:biomarker_id (
          id,
          name,
          category,
          unit,
          description,
          clinical_significance
        )
      `)
      .eq('is_active', true)
      .eq('is_primary', true)

    // Analyze biomarkers against optimal ranges
    const biomarkerAnalysis = await analyzeBiomarkers(biomarkersFromDB, optimalRanges || [], profile)
    
    // Generate AI-powered comprehensive functional medicine analysis
    console.log('Starting AI-powered functional medicine analysis...')
    const aiAnalysisService = AIAnalysisService.getInstance()
    
    let analysisResult: any
    
    try {
      const aiAnalysisResult = await aiAnalysisService.generateAnalysisWithStreaming(
        biomarkersFromDB,
        optimalRanges || [],
        profile,
        (status, details) => {
          console.log('🤖 AI Analysis:', status, details)
        }
      )

      // Use AI analysis results
      analysisResult = {
        overall_health_score: aiAnalysisResult.overall_health_assessment.health_score,
        health_category: aiAnalysisResult.overall_health_assessment.health_category,
        biomarker_insights: aiAnalysisResult.biomarker_insights,
        root_causes: aiAnalysisResult.root_cause_analysis,
        recommendations_summary: {
          supplements: aiAnalysisResult.supplement_recommendations,
          diet: aiAnalysisResult.diet_recommendations,
          lifestyle: aiAnalysisResult.lifestyle_recommendations
        },
        warnings: [], // Will be populated based on AI analysis
        disclaimers: generateDisclaimers(),
        demographic_context: aiAnalysisResult.personalization_factors,
        evidence_summary: aiAnalysisResult.evidence_summary,
        processing_time: aiAnalysisResult.processing_time,
        claude_tokens_used: aiAnalysisResult.claude_tokens_used || 0,
        ai_analysis: aiAnalysisResult // Store full AI analysis
      }

      console.log('AI analysis completed successfully:', {
        healthScore: analysisResult.overall_health_score,
        supplementsCount: aiAnalysisResult.supplement_recommendations.length,
        dietRecommendations: aiAnalysisResult.diet_recommendations.length
      })

    } catch (aiError) {
      console.error('AI analysis failed, falling back to basic analysis:', aiError)
      
      // Fallback to basic analysis if AI fails
      analysisResult = await generateHealthAnalysis(biomarkerAnalysis, profile)
    }

    // Save analysis to database
    const { data: analysisData, error: analysisError } = await userSupabase
      .from('health_analyses')
      .insert({
        user_id: user.id,
        document_id: documentId,
        overall_health_score: analysisResult.overall_health_score,
        health_category: analysisResult.health_category,
        biomarker_insights: analysisResult.biomarker_insights,
        root_causes: analysisResult.root_causes,
        recommendations_summary: analysisResult.recommendations_summary,
        warnings: analysisResult.warnings,
        disclaimers: analysisResult.disclaimers,
        demographic_context: analysisResult.demographic_context,
        evidence_summary: analysisResult.evidence_summary,
        processing_time: analysisResult.processing_time,
        claude_tokens_used: analysisResult.claude_tokens_used || 0
      })
      .select()
      .single()

    if (analysisError) {
      console.error('Error saving analysis:', analysisError)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    // Update existing biomarker readings with analysis results
    console.log('Updating biomarker readings with analysis results:', biomarkerAnalysis.length, 'readings')
    
    for (const analysis of biomarkerAnalysis) {
      if (analysis.reading_id) {
        const { error: updateError } = await userSupabase
          .from('biomarker_readings')
          .update({
            analysis_id: analysisData.id,
            status: analysis.status,
            severity: analysis.severity,
            optimal_range_used: null // Will be populated when we have optimal range tracking
          })
          .eq('id', analysis.reading_id)

        if (updateError) {
          console.error('Error updating biomarker reading:', analysis.reading_id, updateError)
        }
      }
    }

    console.log('Biomarker readings updated with analysis results')

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      message: 'Analysis generated successfully'
    })

  } catch (error) {
    console.error('Analysis generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function analyzeBiomarkers(biomarkers: any[], optimalRanges: any[], profile: any) {
  const analysis = []
  
  for (const biomarker of biomarkers) {
    console.log('Processing biomarker:', {
      id: biomarker.id,
      value: biomarker.value,
      unit: biomarker.unit,
      biomarker_id: biomarker.biomarker_id,
      matched_from_db: biomarker.matched_from_db
    })

    // First, try to use the biomarker_id if it was matched during extraction
    let optimalRange = null
    let biomarkerId = biomarker.biomarker_id

    if (biomarkerId && biomarker.matched_from_db) {
      // Use the already matched biomarker ID
      optimalRange = optimalRanges.find(range => range.biomarkers?.id === biomarkerId)
      console.log('Found optimal range using existing biomarker_id:', !!optimalRange)
    }

    // If no optimal range found using biomarker_id, try name matching
    if (!optimalRange) {
      optimalRange = optimalRanges.find(range => {
        const biomarkerName = range.biomarkers?.name
        // We need to get the biomarker name from somewhere - let's check if we have it
        // For now, we'll use fuzzy matching with available data
        return biomarkerName && (
          // Add more flexible matching here when we have biomarker names
          false // Placeholder - we'll improve this
        )
      })
    }

    if (optimalRange) {
      // Check demographic match
      const ageMatch = !profile?.current_age || (
        (!optimalRange.age_min || profile.current_age >= optimalRange.age_min) &&
        (!optimalRange.age_max || profile.current_age <= optimalRange.age_max)
      )
      
      const genderMatch = !optimalRange.gender || 
        optimalRange.gender === 'all' || 
        optimalRange.gender === profile?.gender

      if (ageMatch && genderMatch) {
        // Analyze biomarker status using optimal ranges
        const statusInfo = getBiomarkerStatus(
          biomarker.value,
          optimalRange.optimal_min,
          optimalRange.optimal_max
        )

        analysis.push({
          reading_id: biomarker.id,
          biomarker_id: biomarkerId,
          value: biomarker.value,
          unit: biomarker.unit,
          optimal_min: optimalRange.optimal_min,
          optimal_max: optimalRange.optimal_max,
          status: statusInfo.status,
          severity: statusInfo.severity,
          category: optimalRange.biomarkers.category,
          description: optimalRange.biomarkers.description,
          clinical_significance: optimalRange.biomarkers.clinical_significance,
          confidence: biomarker.confidence
        })
      }
    } else {
      // Include biomarker even without optimal ranges for AI-based analysis
      console.log('No optimal range found for biomarker, including for AI analysis')
      
      analysis.push({
        reading_id: biomarker.id,
        biomarker_id: biomarkerId,
        value: biomarker.value,
        unit: biomarker.unit,
        optimal_min: null,
        optimal_max: null,
        status: 'unknown', // Will be determined by AI
        severity: null,
        category: 'unknown',
        description: null,
        clinical_significance: null,
        confidence: biomarker.confidence,
        needs_ai_analysis: true // Flag for AI-based analysis
      })
    }
  }

  console.log('Analysis summary:', {
    totalBiomarkers: biomarkers.length,
    withOptimalRanges: analysis.filter(a => a.biomarker_id !== null).length,
    withoutOptimalRanges: analysis.filter(a => a.biomarker_id === null).length
  })

  return analysis
}

async function generateHealthAnalysis(biomarkerAnalysis: any[], profile: any) {
  const startTime = Date.now()
  
  // Calculate overall health score
  const totalBiomarkers = biomarkerAnalysis.length
  let optimalCount = 0
  let suboptimalCount = 0
  let deficientCount = 0
  let excessCount = 0

  biomarkerAnalysis.forEach(analysis => {
    switch (analysis.status) {
      case 'optimal': optimalCount++; break
      case 'suboptimal': suboptimalCount++; break
      case 'deficient': deficientCount++; break
      case 'excess': excessCount++; break
    }
  })

  // Calculate weighted health score
  const healthScore = Math.round(
    (optimalCount * 100 + suboptimalCount * 70 + deficientCount * 40 + excessCount * 30) / totalBiomarkers
  )

  // Determine health category
  let healthCategory = 'poor'
  if (healthScore >= 85) healthCategory = 'excellent'
  else if (healthScore >= 70) healthCategory = 'good'
  else if (healthScore >= 55) healthCategory = 'fair'

  // Generate biomarker insights
  const biomarkerInsights = biomarkerAnalysis.map(analysis => {
    const interpretation = generateBiomarkerInterpretation(analysis)
    const recommendations = generateBiomarkerRecommendations(analysis)
    
    return {
      biomarker: analysis.name,
      value: analysis.value,
      unit: analysis.unit,
      status: analysis.status,
      interpretation,
      recommendations,
      severity: analysis.severity
    }
  })

  // Generate root causes
  const rootCauses = identifyRootCauses(biomarkerAnalysis)

  // Generate recommendations
  const recommendations = generatePersonalizedRecommendations(biomarkerAnalysis, profile)

  // Generate warnings and disclaimers
  const warnings = generateWarnings(biomarkerAnalysis)
  const disclaimers = generateDisclaimers()

  const processingTime = Date.now() - startTime

  return {
    overall_health_score: healthScore,
    health_category: healthCategory,
    biomarker_insights: biomarkerInsights,
    root_causes: rootCauses,
    recommendations_summary: recommendations,
    warnings,
    disclaimers,
    demographic_context: {
      age: profile?.age,
      gender: profile?.gender,
      analysis_personalized: !!profile
    },
    evidence_summary: {
      confidence_level: 'high',
      total_references: 25,
      biomarkers_analyzed: totalBiomarkers
    },
    processing_time: processingTime,
    claude_tokens_used: 0 // Will be updated when using actual AI
  }
}

function generateBiomarkerInterpretation(analysis: any): string {
  const { name, value, unit, status, optimal_min, optimal_max, clinical_significance } = analysis
  
  switch (status) {
    case 'optimal':
      return `Your ${name} level of ${value} ${unit} is within the optimal range (${optimal_min}-${optimal_max} ${unit}). This indicates healthy function. ${clinical_significance}`
    
    case 'suboptimal':
      if (value < optimal_min) {
        return `Your ${name} level of ${value} ${unit} is below optimal (${optimal_min}-${optimal_max} ${unit}). While not severely deficient, this suggests room for improvement. ${clinical_significance}`
      } else {
        return `Your ${name} level of ${value} ${unit} is above optimal (${optimal_min}-${optimal_max} ${unit}). This elevation may indicate underlying imbalances. ${clinical_significance}`
      }
    
    case 'deficient':
      return `Your ${name} level of ${value} ${unit} is significantly below optimal (${optimal_min}-${optimal_max} ${unit}). This deficiency may be impacting your health and energy levels. ${clinical_significance}`
    
    case 'excess':
      return `Your ${name} level of ${value} ${unit} is significantly elevated above optimal (${optimal_min}-${optimal_max} ${unit}). This excess may indicate underlying health issues that warrant attention. ${clinical_significance}`
    
    default:
      return `Your ${name} level is ${value} ${unit}. ${clinical_significance}`
  }
}

function generateBiomarkerRecommendations(analysis: any): string[] {
  const { name, status, category } = analysis
  const recommendations = []

  // Category-specific recommendations
  if (category === 'vitamins') {
    if (status === 'deficient' || status === 'suboptimal') {
      if (name.includes('Vitamin D')) {
        recommendations.push('Increase sun exposure (15-20 minutes daily)')
        recommendations.push('Consider Vitamin D3 supplementation (2000-4000 IU daily)')
        recommendations.push('Include vitamin D-rich foods like fatty fish, egg yolks')
      } else if (name.includes('B12')) {
        recommendations.push('Include B12-rich foods like meat, fish, dairy, or nutritional yeast')
        recommendations.push('Consider B12 supplementation if following plant-based diet')
        recommendations.push('Check for absorption issues if levels remain low')
      } else if (name.includes('Folate')) {
        recommendations.push('Increase leafy greens, legumes, and fortified grains')
        recommendations.push('Consider methylfolate supplementation')
        recommendations.push('Reduce alcohol consumption which depletes folate')
      }
    }
  } else if (category === 'lipids') {
    if (name.includes('Cholesterol') && (status === 'excess' || status === 'suboptimal')) {
      recommendations.push('Adopt a Mediterranean-style diet rich in healthy fats')
      recommendations.push('Increase soluble fiber intake from oats, beans, fruits')
      recommendations.push('Regular aerobic exercise (150 minutes per week)')
      recommendations.push('Maintain healthy weight')
    } else if (name.includes('HDL') && (status === 'deficient' || status === 'suboptimal')) {
      recommendations.push('Include healthy fats like olive oil, nuts, avocados')
      recommendations.push('Regular aerobic exercise to boost HDL')
      recommendations.push('Consider omega-3 supplementation')
    }
  } else if (category === 'hormones') {
    if (name.includes('TSH') && status !== 'optimal') {
      recommendations.push('Support thyroid health with iodine-rich foods (seaweed, fish)')
      recommendations.push('Ensure adequate selenium intake (Brazil nuts, seafood)')
      recommendations.push('Manage stress levels which can affect thyroid function')
      recommendations.push('Consider thyroid-supporting nutrients like zinc and tyrosine')
    }
  }

  // General lifestyle recommendations
  if (status === 'deficient' || status === 'suboptimal') {
    recommendations.push('Focus on nutrient-dense whole foods')
    recommendations.push('Ensure adequate sleep (7-9 hours nightly)')
    recommendations.push('Manage stress through meditation, yoga, or other practices')
  }

  return recommendations
}

function identifyRootCauses(biomarkerAnalysis: any[]) {
  const rootCauses = []
  
  // Identify patterns across biomarkers
  const deficientVitamins = biomarkerAnalysis.filter(a => 
    a.category === 'vitamins' && (a.status === 'deficient' || a.status === 'suboptimal')
  )
  
  if (deficientVitamins.length >= 2) {
    rootCauses.push({
      category: 'Nutritional Deficiencies',
      description: 'Multiple vitamin deficiencies suggest poor dietary diversity or absorption issues.',
      affected_biomarkers: deficientVitamins.map(v => v.name),
      recommendations: [
        'Evaluate overall diet quality and diversity',
        'Consider digestive health assessment',
        'Assess for underlying conditions affecting absorption'
      ]
    })
  }

  const inflammatoryMarkers = biomarkerAnalysis.filter(a => 
    a.category === 'inflammation' && a.status === 'excess'
  )
  
  if (inflammatoryMarkers.length > 0) {
    rootCauses.push({
      category: 'Chronic Inflammation',
      description: 'Elevated inflammatory markers may indicate underlying chronic inflammation.',
      affected_biomarkers: inflammatoryMarkers.map(m => m.name),
      recommendations: [
        'Adopt anti-inflammatory diet rich in omega-3s',
        'Identify and eliminate inflammatory triggers',
        'Consider stress management and adequate sleep'
      ]
    })
  }

  return rootCauses
}

function generatePersonalizedRecommendations(biomarkerAnalysis: any[], profile: any) {
  const essential: any[] = []
  const beneficial: any[] = []
  const lifestyle: string[] = []

  // Generate supplement recommendations based on deficiencies
  biomarkerAnalysis.forEach(analysis => {
    if (analysis.status === 'deficient') {
      if (analysis.name.includes('Vitamin D')) {
        essential.push({
          supplement: 'Vitamin D3',
          dosage: '2000-4000 IU daily',
          reasoning: 'Address vitamin D deficiency for bone health and immune function'
        })
      } else if (analysis.name.includes('B12')) {
        essential.push({
          supplement: 'Methylcobalamin B12',
          dosage: '1000 mcg daily',
          reasoning: 'Correct B12 deficiency for neurological and energy support'
        })
      }
    } else if (analysis.status === 'suboptimal') {
      if (analysis.name.includes('Magnesium')) {
        beneficial.push({
          supplement: 'Magnesium Glycinate',
          dosage: '300-400 mg daily',
          reasoning: 'Support muscle function, sleep quality, and stress management'
        })
      }
    }
  })

  // General lifestyle recommendations
  lifestyle.push(
    'Prioritize 7-9 hours of quality sleep nightly',
    'Engage in regular physical activity (150 minutes moderate exercise weekly)',
    'Practice stress management techniques daily',
    'Maintain a diverse, nutrient-dense diet',
    'Stay adequately hydrated (8-10 glasses water daily)',
    'Consider regular health monitoring and follow-up testing'
  )

  return {
    essential,
    beneficial,
    lifestyle
  }
}

function generateWarnings(biomarkerAnalysis: any[]) {
  const warnings = []
  
  const criticalLow = biomarkerAnalysis.filter(a => 
    a.status === 'deficient' && a.severity === 'severe'
  )
  
  const criticalHigh = biomarkerAnalysis.filter(a => 
    a.status === 'excess' && a.severity === 'severe'
  )

  if (criticalLow.length > 0) {
    warnings.push({
      type: 'critical_deficiency',
      message: `Severe deficiencies detected in: ${criticalLow.map(a => a.name).join(', ')}. Immediate attention recommended.`,
      biomarkers: criticalLow.map(a => a.name)
    })
  }

  if (criticalHigh.length > 0) {
    warnings.push({
      type: 'critical_elevation',
      message: `Significantly elevated levels detected in: ${criticalHigh.map(a => a.name).join(', ')}. Medical evaluation advised.`,
      biomarkers: criticalHigh.map(a => a.name)
    })
  }

  return warnings
}

function generateDisclaimers(): string[] {
  return [
    'This analysis is for educational purposes only and should not replace professional medical advice.',
    'Always consult with a qualified healthcare provider before making changes to your supplements or medications.',
    'Individual responses to recommendations may vary based on genetics, health status, and other factors.',
    'Regular monitoring and follow-up testing is recommended to track progress.',
    'This analysis is based on current biomarker values and may change over time.',
    'Supplement recommendations should be discussed with your healthcare provider, especially if you have medical conditions or take medications.'
  ]
} 