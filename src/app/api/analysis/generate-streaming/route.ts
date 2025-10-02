import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth-server'
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

    // Get biomarkers from biomarker_readings table
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

    // Get user demographic profile
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

    // Create a ReadableStream for streaming analysis updates
    let isCancelled = false
    let controllerClosed = false
    const abortController = new AbortController()
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const sendUpdate = (status: string, details?: any) => {
          try {
            // Check if stream was cancelled or controller is closed
            if (isCancelled || controllerClosed || controller.desiredSize === null) {
              console.log('Stream cancelled or closed, skipping update:', status)
              return
            }
            
            const update = JSON.stringify({ 
              status, 
              details, 
              timestamp: new Date().toISOString() 
            }) + '\n'
            controller.enqueue(encoder.encode(update))
          } catch (error) {
            // Mark controller as closed to prevent further attempts
            controllerClosed = true
            // Log but don't throw - this prevents the entire analysis from failing
            console.log('Failed to send stream update (likely cancelled):', status, error)
          }
        }

        try {
          sendUpdate('Starting comprehensive functional medicine analysis...', { 
            biomarkersCount: biomarkersFromDB.length 
          })

          const aiAnalysisService = AIAnalysisService.getInstance()
          
          const aiAnalysisResult = await aiAnalysisService.generateAnalysisWithStreaming(
            biomarkersFromDB,
            optimalRanges || [],
            profile,
            (status, details) => {
              // Double-check cancellation state before forwarding to sendUpdate
              if (!isCancelled && !controllerClosed && !abortController.signal.aborted) {
                sendUpdate(status, details)
              }
            },
            abortController.signal
          )

          sendUpdate('Saving analysis results...', { 
            stage: 'saving',
            insights: aiAnalysisResult.biomarker_insights.length,
            supplements: aiAnalysisResult.supplement_recommendations.length
          })

          // Prepare analysis result for database
          const analysisForDB = {
            user_id: user.id,
            document_id: documentId,
            overall_health_score: aiAnalysisResult.overall_health_assessment.health_score,
            health_category: aiAnalysisResult.overall_health_assessment.health_category,
            biomarker_insights: aiAnalysisResult.biomarker_insights,
            root_causes: aiAnalysisResult.root_cause_analysis,
            recommendations_summary: {
              supplements: aiAnalysisResult.supplement_recommendations,
              diet: aiAnalysisResult.diet_recommendations,
              lifestyle: aiAnalysisResult.lifestyle_recommendations
            },
            warnings: [],
            disclaimers: [
              'This analysis is for educational purposes only and should not replace professional medical advice.',
              'Always consult with a qualified healthcare provider before making changes to your supplements or medications.',
              'Individual responses to recommendations may vary based on genetics, health status, and other factors.'
            ],
            demographic_context: aiAnalysisResult.personalization_factors,
            evidence_summary: aiAnalysisResult.evidence_summary,
            processing_time: aiAnalysisResult.processing_time,
            claude_tokens_used: aiAnalysisResult.claude_tokens_used || 0
          }

          // Save analysis to database
          const { data: analysisData, error: analysisError } = await userSupabase
            .from('health_analyses')
            .insert(analysisForDB)
            .select()
            .single()

          if (analysisError) {
            console.error('Error saving analysis:', analysisError)
            sendUpdate('❌ Error saving analysis', { error: analysisError.message })
            throw new Error('Failed to save analysis')
          }

          sendUpdate('Saving structured recommendations...', { 
            stage: 'recommendations',
            supplements: aiAnalysisResult.supplement_recommendations.length,
            diet: aiAnalysisResult.diet_recommendations.length,
            lifestyle: aiAnalysisResult.lifestyle_recommendations.length
          })

          // Save structured supplement recommendations
          if (aiAnalysisResult.supplement_recommendations && aiAnalysisResult.supplement_recommendations.length > 0) {
            const supplementRecommendations = aiAnalysisResult.supplement_recommendations.map((supplement: any) => ({
              analysis_id: analysisData.id,
              supplement_name: supplement.name,
              dosage_amount: parseInt(supplement.dosage.split(' ')[0]) || 0,
              dosage_unit: supplement.dosage.split(' ').slice(1).join(' ') || 'mg',
              frequency: supplement.frequency,
              timing: supplement.timing || null,
              duration_weeks: supplement.duration ? parseInt(supplement.duration.split(' ')[0]) * 4 : null, // Convert months to weeks
              priority: supplement.priority || 'beneficial',
              reason: supplement.reasoning,
              target_biomarkers: supplement.target_biomarkers || [],
              expected_outcome: supplement.expected_improvement || null,
              evidence_level: supplement.contraindications ? 'moderate' : 'limited',
              contraindications: supplement.contraindications || [],
              drug_interactions: supplement.drug_interactions || [],
              monitoring_needed: supplement.monitoring ? [supplement.monitoring] : [],
              estimated_monthly_cost: supplement.cost_estimate ? parseFloat(supplement.cost_estimate.replace(/[^0-9.]/g, '')) : null
            }))

            const { error: supplementError } = await userSupabase
              .from('supplement_recommendations')
              .insert(supplementRecommendations)

            if (supplementError) {
              console.error('Error saving supplement recommendations:', supplementError)
            } else {
              sendUpdate('✅ Supplement recommendations saved', { count: supplementRecommendations.length })
            }
          }

          // Save structured diet recommendations
          if (aiAnalysisResult.diet_recommendations && aiAnalysisResult.diet_recommendations.length > 0) {
            const dietRecommendations = aiAnalysisResult.diet_recommendations.map((diet: any) => ({
              analysis_id: analysisData.id,
              category: diet.category,
              plan_name: diet.category || 'Personalized Diet Plan',
              recommendation: diet.specific_foods.join(', ') || diet.category,
              specific_foods: diet.specific_foods || [],
              foods_to_include: diet.specific_foods || [],
              target_biomarkers: diet.target_biomarkers || [],
              reasoning: diet.reasoning,
              priority: 'beneficial',
              implementation_guidance: diet.implementation || null,
              implementation_steps: diet.implementation ? [diet.implementation] : [],
              portion_guidance: diet.portion_guidance || null,
              portion_guidelines: diet.portion_guidance || null,
              expected_timeline: diet.expected_timeline || null,
              expected_improvements: diet.expected_timeline || null,
              evidence_level: 'moderate',
              plan_type: 'general'
            }))

            const { error: dietError } = await userSupabase
              .from('diet_plan_recommendations')
              .insert(dietRecommendations)

            if (dietError) {
              console.error('Error saving diet recommendations:', dietError)
            } else {
              sendUpdate('✅ Diet recommendations saved', { count: dietRecommendations.length })
            }
          }

          // Save structured workout recommendations
          if (aiAnalysisResult.lifestyle_recommendations && aiAnalysisResult.lifestyle_recommendations.length > 0) {
            const workoutRecommendations = aiAnalysisResult.lifestyle_recommendations
              .filter((lifestyle: any) => lifestyle.category && lifestyle.category.toLowerCase().includes('exercise'))
              .map((workout: any) => ({
                analysis_id: analysisData.id,
                exercise_type: workout.category.toLowerCase().includes('cardio') ? 'cardiovascular' : 
                             workout.category.toLowerCase().includes('strength') ? 'strength_training' :
                             workout.category.toLowerCase().includes('flexibility') ? 'flexibility' : 'general',
                specific_exercises: workout.specific_recommendation ? [workout.specific_recommendation] : [],
                intensity: 'moderate',
                duration_minutes: workout.specific_recommendation && workout.specific_recommendation.includes('30') ? 30 :
                                 workout.specific_recommendation && workout.specific_recommendation.includes('45') ? 45 :
                                 workout.specific_recommendation && workout.specific_recommendation.includes('60') ? 60 : null,
                frequency_per_week: workout.specific_recommendation && workout.specific_recommendation.includes('3') ? 3 :
                                   workout.specific_recommendation && workout.specific_recommendation.includes('4') ? 4 :
                                   workout.specific_recommendation && workout.specific_recommendation.includes('5') ? 5 : 3,
                target_biomarkers: workout.target_biomarkers || [],
                reasoning: workout.reasoning,
                priority: 'beneficial',
                expected_timeline: workout.expected_timeline || null,
                evidence_level: 'moderate'
              }))

            if (workoutRecommendations.length > 0)
              // Save workout recommendations
              await userSupabase
                .from('workout_recommendations')
                .insert(workoutRecommendations)

            // Save structured diet plan recommendations
            const dietPlanRecommendations = aiAnalysisResult.lifestyle_recommendations
              .filter((lifestyle: any) => lifestyle.category && lifestyle.category.toLowerCase().includes('diet_plan'))
              .map((diet: any) => ({
                analysis_id: analysisData.id,
                plan_type: 'general',
                plan_name: diet.category || 'Personalized Diet Plan',
                reasoning: diet.reasoning,
                target_biomarkers: diet.target_biomarkers || [],
                implementation_steps: diet.implementation_steps || [],
                expected_timeline: diet.expected_benefits || null,
                expected_improvements: diet.expected_benefits || null,
                priority: 'beneficial',
                evidence_level: 'moderate'
              }))

            if (dietPlanRecommendations.length > 0)
              await userSupabase
                .from('diet_plan_recommendations')
                .insert(dietPlanRecommendations)

            // Save other lifestyle recommendations (sleep, stress, etc.)
            const otherLifestyleRecommendations = aiAnalysisResult.lifestyle_recommendations
              .filter((lifestyle: any) => {
                const category = lifestyle.category?.toLowerCase() || ''
                return !category.includes('exercise') && 
                       !category.includes('diet_plan') && 
                       !category.includes('alcohol') && 
                       !category.includes('hepatotoxin')
              })
              .map((lifestyle: any) => ({
                analysis_id: analysisData.id,
                category: lifestyle.category?.toLowerCase() || 'general',
                recommendation_title: lifestyle.category || 'Lifestyle Recommendation',
                specific_recommendation: lifestyle.specific_recommendation,
                target_biomarkers: lifestyle.target_biomarkers || [],
                reasoning: lifestyle.reasoning,
                implementation_steps: lifestyle.implementation_steps || [],
                frequency: lifestyle.frequency,
                expected_benefits: lifestyle.expected_benefits,
                expected_timeline: lifestyle.expected_benefits || null,
                priority: 'beneficial',
                evidence_level: 'moderate'
              }))

            if (otherLifestyleRecommendations.length > 0)
              await userSupabase
                .from('lifestyle_recommendations')
                .insert(otherLifestyleRecommendations)
          }

          sendUpdate('Updating biomarker readings...', { 
            stage: 'biomarker_update',
            biomarkers: biomarkersFromDB.length
          })

          // Update existing biomarker readings with analysis results
          for (const insight of aiAnalysisResult.biomarker_insights) {
            const reading = biomarkersFromDB.find(r => 
              r.value === insight.current_value && 
              r.unit === insight.unit
            )
            
            if (reading) {
              const { error: updateError } = await userSupabase
                .from('biomarker_readings')
                .update({
                  analysis_id: analysisData.id,
                  status: insight.status,
                  severity: insight.priority_for_intervention === 'critical' ? 'severe' :
                           insight.priority_for_intervention === 'high' ? 'moderate' : 'mild'
                })
                .eq('id', reading.id)

              if (updateError) {
                console.error('Error updating biomarker reading:', updateError)
              }
            }
          }

          sendUpdate('✅ Analysis complete!', {
            stage: 'complete',
            analysisId: analysisData.id,
            healthScore: aiAnalysisResult.overall_health_assessment.health_score,
            healthCategory: aiAnalysisResult.overall_health_assessment.health_category,
            supplementsCount: aiAnalysisResult.supplement_recommendations.length,
            dietRecommendationsCount: aiAnalysisResult.diet_recommendations.length,
            processingTime: aiAnalysisResult.processing_time
          })

          // Only close if not already cancelled or closed
          if (!isCancelled && !controllerClosed) {
            try {
              controller.close()
              controllerClosed = true
            } catch (error) {
              console.log('Controller already closed:', error)
            }
          }

        } catch (error) {
          console.error('Streaming analysis error:', error)
          sendUpdate('💥 Analysis failed', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          
          // Only close if not already cancelled or closed
          if (!isCancelled && !controllerClosed) {
            try {
              controller.close()
              controllerClosed = true
            } catch (closeError) {
              console.log('Controller already closed during error handling:', closeError)
            }
          }
        }
      },
      
      cancel(reason) {
        console.log('Stream cancelled by client:', reason)
        isCancelled = true
        controllerClosed = true
        // Signal the AI analysis to abort if possible
        abortController.abort(reason)
        // Stream was cancelled/aborted by the client
        // The AI analysis might still be running, but we can't send updates anymore
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Analysis generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 