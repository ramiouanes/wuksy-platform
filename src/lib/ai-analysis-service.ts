/**
 * ⚠️ DEPRECATION NOTICE ⚠️
 * 
 * This service is DEPRECATED as of 2025-11-08.
 * 
 * Analysis now runs in Supabase edge functions for consistency between mobile and web apps.
 * See: wuksy-backend/supabase/functions/analyze-biomarkers
 * 
 * Web app now proxies through:
 * - /api/analysis/generate-streaming (triggers analysis)
 * - /api/analysis/status (polls for updates)
 * 
 * This file is kept for:
 * 1. Reference and documentation
 * 2. Emergency rollback capability
 * 3. Understanding the analysis logic that was migrated
 * 
 * DO NOT MODIFY OR USE IN NEW CODE.
 * 
 * Migration completed by: AGENT 6 - Update Web App Integration
 * Edge function path: wuksy-backend/supabase/functions/analyze-biomarkers/index.ts
 */

import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

// Type definitions for biomarker analysis
export interface BiomarkerReading {
  id: string;
  biomarker_id: string | null;
  value: number;
  unit: string;
  confidence?: number;
  matched_from_db?: boolean;
  optimal_min?: number | null;
  optimal_max?: number | null;
  status?: 'deficient' | 'suboptimal' | 'optimal' | 'excess' | 'concerning' | 'unknown' | null;
  severity?: 'mild' | 'moderate' | 'severe' | null;
  category?: string;
  biomarker_name?: string;
}

export interface UserProfile {
  current_age?: number;
  gender?: 'male' | 'female' | 'other';
  menstrual_cycle_length?: number;
  current_menstrual_phase?: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  pregnancy_status?: 'not_pregnant' | 'pregnant' | 'postpartum';
  menopause_status?: 'premenopausal' | 'perimenopausal' | 'postmenopausal';
  bmi?: number;
  health_conditions?: string[];
  medications?: string[];
  lifestyle_factors?: any;
  supplement_preferences?: any;
}

// Zod schemas for structured AI outputs
const SupplementRecommendationZ = z.object({
  name: z.string().describe("Natural supplement name (vitamins, minerals, herbs, nutraceuticals ONLY - NO pharmaceuticals)"),
  form: z.string().describe("Preferred form (capsule, liquid, powder, etc.)"),
  dosage: z.string().describe("Concise dosage with units (e.g., '1000mg', '2 capsules', '1 tsp') - keep short and specific"),
  frequency: z.string().describe("Simple frequency (e.g., 'Daily', 'Twice daily', '3x per week') - keep concise"),
  timing: z.string().describe("Brief timing instruction (e.g., 'With breakfast', 'Empty stomach', 'Before bed') - keep short"),
  duration: z.string().describe("Clear duration (e.g., '3 months', '8-12 weeks', 'Ongoing') - keep brief"),
  priority: z.enum(["essential", "beneficial", "optional"]).describe("Priority level"),
  reasoning: z.string().describe("Why this natural supplement is recommended"),
  target_biomarkers: z.array(z.string()).describe("Which biomarkers this addresses"),
  expected_improvement: z.string().describe("Expected improvement timeline and magnitude"),
  contraindications: z.array(z.string()).describe("Who should avoid this supplement"),
  drug_interactions: z.array(z.string()).describe("Potential drug interactions with this supplement"),
  monitoring: z.string().describe("What to monitor while taking this supplement"),
  cost_estimate: z.string().describe("Estimated monthly cost range (e.g., '$15-25', '$30-40') - keep brief")
});

const DietRecommendationZ = z.object({
  category: z.string().describe("Diet category (foods to increase, foods to avoid, meal timing, etc.)"),
  specific_foods: z.array(z.string()).describe("Specific foods or food groups"),
  reasoning: z.string().describe("Why these dietary changes help"),
  target_biomarkers: z.array(z.string()).describe("Which biomarkers this addresses"),
  implementation: z.string().describe("How to implement these changes"),
  expected_timeline: z.string().describe("When to expect benefits"),
  portion_guidance: z.string().describe("Serving sizes and frequency")
});

const LifestyleRecommendationZ = z.object({
  category: z.string().describe("Lifestyle category (exercise, sleep, stress, diet_plan, etc. - EXCLUDE alcohol and hepatotoxins)"),
  specific_recommendation: z.string().describe("Detailed recommendation"),
  reasoning: z.string().describe("Why this helps optimize biomarkers"),
  target_biomarkers: z.array(z.string()).describe("Which biomarkers this addresses"),
  implementation_steps: z.array(z.string()).describe("Step-by-step implementation"),
  frequency: z.string().describe("How often to implement"),
  expected_benefits: z.string().describe("Expected benefits and timeline")
});

const RootCauseAnalysisZ = z.object({
  category: z.string().describe("Root cause category"),
  affected_biomarkers: z.array(z.string()).describe("Biomarkers affected by this root cause"),
  description: z.string().describe("Detailed explanation of the root cause"),
  contributing_factors: z.array(z.string()).describe("Contributing factors"),
  priority: z.enum(["high", "medium", "low"]).describe("Priority to address"),
  intervention_approach: z.string().describe("How to address this root cause")
});

const HealthInsightZ = z.object({
  biomarker_name: z.string().describe("Name of the biomarker"),
  current_value: z.number().describe("Current value"),
  unit: z.string().describe("Unit of measurement"),
  status: z.enum(["deficient", "suboptimal", "optimal", "excess", "concerning"]).describe("Status relative to optimal"),
  optimal_range: z.string().describe("Optimal range for this person"),
  gap_analysis: z.string().describe("How far from optimal and what this means"),
  clinical_significance: z.string().describe("What this biomarker tells us about health"),
  functional_medicine_perspective: z.string().describe("Functional medicine interpretation"),
  interconnections: z.array(z.string()).describe("How this relates to other biomarkers"),
  priority_for_intervention: z.enum(["critical", "high", "medium", "low"]).describe("Priority for intervention")
});

const ComprehensiveAnalysisZ = z.object({
  overall_health_assessment: z.object({
    health_score: z.number().min(0).max(100).describe("Overall health score 0-100"),
    health_category: z.enum(["poor", "fair", "good", "excellent"]).describe("Overall health category"),
    key_strengths: z.array(z.string()).describe("Areas where health is optimal"),
    priority_concerns: z.array(z.string()).describe("Most important areas to address"),
    trajectory: z.string().describe("Whether health markers suggest improvement or decline")
  }),
  
  biomarker_insights: z.array(HealthInsightZ).describe("Detailed analysis of each biomarker"),
  
  root_cause_analysis: z.array(RootCauseAnalysisZ).describe("Underlying causes of imbalances"),
  
  supplement_recommendations: z.array(SupplementRecommendationZ).describe("Personalized natural supplement protocol (nutraceuticals only, no pharmaceuticals)"),
  
  diet_recommendations: z.array(DietRecommendationZ).describe("Specific dietary interventions"),
  
  lifestyle_recommendations: z.array(LifestyleRecommendationZ).describe("Lifestyle modifications"),
  
  monitoring_plan: z.object({
    retest_timeline: z.string().describe("When to retest biomarkers"),
    key_biomarkers_to_track: z.array(z.string()).describe("Most important biomarkers to monitor"),
    symptoms_to_monitor: z.array(z.string()).describe("Symptoms that may improve"),
    success_metrics: z.array(z.string()).describe("How to measure progress")
  }),
  
  personalization_factors: z.object({
    age_considerations: z.string().describe("Age-specific considerations"),
    gender_considerations: z.string().describe("Gender-specific considerations"),
    individual_factors: z.array(z.string()).describe("Individual health factors considered"),
    contraindications: z.array(z.string()).describe("Important contraindications or cautions"),
    supplement_approach: z.string().describe("Confirmation that only natural supplements and nutraceuticals were recommended, no pharmaceuticals")
  }),
  
  evidence_summary: z.object({
    confidence_level: z.enum(["high", "medium", "low"]).describe("Overall confidence in recommendations"),
    evidence_quality: z.string().describe("Quality of evidence supporting recommendations"),
    limitations: z.array(z.string()).describe("Limitations of this analysis"),
    clinical_correlation_needed: z.boolean().describe("Whether clinical correlation is needed")
  }),
  
  next_steps: z.object({
    immediate_actions: z.array(z.string()).describe("What to start immediately"),
    short_term_goals: z.array(z.string()).describe("Goals for next 1-3 months"),
    long_term_goals: z.array(z.string()).describe("Goals for 6+ months"),
    healthcare_provider_discussion: z.array(z.string()).describe("Topics to discuss with healthcare provider")
  })
});

type ComprehensiveAnalysisType = z.infer<typeof ComprehensiveAnalysisZ>;

export interface AnalysisResult extends ComprehensiveAnalysisType {
  processing_time: number;
  claude_tokens_used?: number;
}

export class AIAnalysisService {
  private openai: OpenAI | null = null;
  private static instance: AIAnalysisService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('AIAnalysisService constructor - API key available:', !!apiKey);
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      console.log('OpenAI client initialized for analysis service');
    } else {
      console.warn('OpenAI API key not found. AI-enhanced analysis will be unavailable.');
    }
  }

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  /**
   * Generate comprehensive functional medicine analysis with personalized recommendations
   */
  async generateAnalysis(
    biomarkerReadings: BiomarkerReading[],
    optimalRanges: any[],
    userProfile: UserProfile,
    onProgress?: (status: string, details?: any) => void,
    abortSignal?: AbortSignal
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    if (!this.openai) {
      throw new Error('OpenAI client not initialized - cannot perform AI analysis');
    }

    try {
      onProgress?.('🧬 Analyzing biomarker patterns...', { 
        phase: 'pattern_analysis',
        biomarkersCount: biomarkerReadings.length 
      });

      const analysisResult = await this.comprehensiveFunctionalMedicineAnalysis(
        biomarkerReadings,
        optimalRanges,
        userProfile,
        onProgress,
        abortSignal
      );

      const processingTime = Date.now() - startTime;

      return {
        ...analysisResult,
        processing_time: processingTime,
        claude_tokens_used: 0 // Will be updated when we can track tokens
      };

    } catch (error) {
      console.error('AI Analysis failed:', error);
      onProgress?.('💥 Analysis failed', { 
        phase: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Generate analysis with streaming progress updates
   */
  async generateAnalysisWithStreaming(
    biomarkerReadings: BiomarkerReading[],
    optimalRanges: any[],
    userProfile: UserProfile,
    onProgress?: (status: string, details?: any) => void,
    abortSignal?: AbortSignal
  ): Promise<AnalysisResult> {
    return this.generateAnalysis(biomarkerReadings, optimalRanges, userProfile, onProgress, abortSignal);
  }

  /**
   * Core functional medicine analysis using advanced AI
   */
  private async comprehensiveFunctionalMedicineAnalysis(
    biomarkerReadings: BiomarkerReading[],
    optimalRanges: any[],
    userProfile: UserProfile,
    onProgress?: (status: string, details?: any) => void,
    abortSignal?: AbortSignal
  ): Promise<ComprehensiveAnalysisType> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

    onProgress?.('🎯 Preparing comprehensive functional medicine analysis...', { 
      phase: 'preparation',
      biomarkersCount: biomarkerReadings.length,
      thoughtProcess: 'Organizing biomarker data and user profile for deep analysis'
    });

    onProgress?.('🤖 Initializing AI reasoning system...', { 
      phase: 'initialization',
      documentLength: biomarkerReadings.length,
      model
    });

    const systemPrompt = `You are a world-class functional medicine practitioner and biomarker analysis expert with deep knowledge of:
- Functional medicine principles and root cause analysis
- Biomarker interpretation beyond conventional ranges
- Personalized nutrition and supplementation protocols
- Evidence-based natural interventions
- Metabolic pathways and nutrient interactions
- Gender, age, and lifestyle-specific health optimization

Your task is to provide a comprehensive functional medicine analysis of biomarker data with personalized recommendations for optimization.

CRITICAL RESTRICTION - SUPPLEMENTS ONLY:
You MUST ONLY recommend nutraceuticals, supplements, vitamins, minerals, herbs, and natural compounds. 
DO NOT recommend any pharmaceutical drugs, prescription medications, or synthetic pharmaceutical compounds.
Focus exclusively on natural health interventions available as dietary supplements.

ANALYSIS PRINCIPLES:
1. Look for patterns and relationships between biomarkers
2. Consider functional ranges, not just conventional lab ranges
3. Identify root causes, not just symptoms
4. Personalize recommendations based on individual factors
5. Prioritize interventions by impact and safety
6. Consider nutrient interactions and timing
7. Address the whole person, not isolated biomarkers
8. Provide evidence-based recommendations with clear reasoning
9. ONLY recommend natural supplements and nutraceuticals - NO pharmaceuticals

PERSONALIZATION FACTORS:
- Age and gender-specific needs
- Hormonal status (menstrual cycle, menopause, etc.)
- Current health conditions and medications
- Lifestyle factors and preferences
- Biomarker interactions and patterns

Return ONLY valid JSON with the specified structure - no additional text.`;

    const biomarkerSummary = biomarkerReadings.map(reading => {
      const optimalRange = optimalRanges.find(range => 
        range.biomarkers?.id === reading.biomarker_id
      );
      
      return {
        name: reading.biomarker_name || 'Unknown',
        current_value: reading.value,
        unit: reading.unit,
        optimal_min: reading.optimal_min || optimalRange?.optimal_min,
        optimal_max: reading.optimal_max || optimalRange?.optimal_max,
        status: reading.status,
        severity: reading.severity,
        category: reading.category,
        confidence: reading.confidence
      };
    }).filter(b => b.current_value !== null);

    const userPrompt = `Perform a comprehensive functional medicine analysis of these biomarkers and provide personalized recommendations.

BIOMARKER DATA:
${JSON.stringify(biomarkerSummary, null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

ANALYSIS REQUIREMENTS:
1. Analyze each biomarker in context of optimal functional ranges
2. Identify patterns and relationships between biomarkers
3. Determine root causes of any imbalances
4. Create personalized SUPPLEMENT PROTOCOL with specific dosages (NUTRACEUTICALS ONLY)
5. Recommend targeted dietary interventions
6. Suggest lifestyle modifications (exercise, sleep, stress management, diet_plan - EXCLUDE alcohol and hepatotoxins)
7. Provide monitoring and follow-up plan
8. Consider all personalization factors

SUPPLEMENT RESTRICTIONS - CRITICAL:
- ONLY recommend natural supplements, vitamins, minerals, herbs, and nutraceuticals
- DO NOT recommend pharmaceutical drugs, prescription medications, or synthetic drugs
- Focus on compounds available as dietary supplements or food-based interventions
- Examples: Vitamin D3, Magnesium, Omega-3, Probiotics, Curcumin, etc.
- NEVER recommend: Metformin, Statins, Blood pressure medications, Hormonal drugs, etc.

FUNCTIONAL MEDICINE FOCUS AREAS:
- Nutrient deficiencies and optimal repletion through supplements
- Hormonal balance through natural compounds and lifestyle
- Metabolic health through nutraceuticals and diet
- Inflammatory patterns reduction through natural anti-inflammatories
- Detoxification support through natural compounds
- Digestive health through probiotics and digestive enzymes
- Cardiovascular optimization through natural supplements
- Neurological support through nootropic supplements
- Energy production through mitochondrial support supplements

LIFESTYLE RECOMMENDATIONS REQUIREMENTS:
- Include exercise recommendations (cardio, strength, flexibility)
- Include sleep optimization strategies
- Include stress management techniques
- Include diet plan recommendations (meal timing, macronutrient balance, specific dietary protocols)
- DO NOT include alcohol consumption recommendations or hepatotoxin-related advice
- Focus on positive lifestyle interventions that support biomarker optimization

For each recommendation:
- Explain the mechanism of action
- Provide specific dosages and timing
- Consider interactions and contraindications
- Estimate timeline for improvements
- Include monitoring recommendations
- ENSURE all recommendations are natural supplements/nutraceuticals ONLY

CRITICAL FORMATTING REQUIREMENTS FOR UI DISPLAY:
- DOSAGE: Use concise format (e.g., "1000mg", "2 capsules", "1 tsp") - NO long explanations
- FREQUENCY: Keep simple (e.g., "Daily", "Twice daily", "3x per week") - NO complex schedules
- TIMING: Brief instructions only (e.g., "With breakfast", "Empty stomach", "Before bed") - NO lengthy explanations
- DURATION: Clear, short format (e.g., "3 months", "8-12 weeks", "Ongoing") - NO verbose descriptions
- COST_ESTIMATE: Simple range format (e.g., "$15-25", "$30-40") - NO detailed explanations

These fields must be concise and display-friendly for the app interface. Keep all dosage, timing, frequency, and duration fields SHORT and SPECIFIC.

Be specific, practical, and evidence-based. Consider the person's age, gender, and health status in all recommendations. Remember: SUPPLEMENTS AND NUTRACEUTICALS ONLY - NO PHARMACEUTICALS.`;

        try {
      console.log('Starting OpenAI responses API call with reasoning...')
      onProgress?.('🧠 Starting AI reasoning process...', { 
        phase: 'reasoning',
        step: 'api_call_start',
        thoughtProcess: 'Sending request to OpenAI with reasoning enabled'
      })

      const response = await this.openai.responses.create({
        model,
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: userPrompt }
            ]
          }
        ],
        stream: true, // Enable streaming
        reasoning: {
          effort: "medium", // Let GPT-5 use medium reasoning effort
          summary: "auto" // Get detailed reasoning summaries
        },
        text: {
          format: zodTextFormat(ComprehensiveAnalysisZ, "functional_medicine_analysis")
        }  
      });

      let fullResponse = '';
      let chunkCount = 0;
      let generatedTokens = 0;
      let reasoningTokens = 0;
      
      console.log('Processing streaming response...')
      
      // Process the streaming response - only show meaningful AI reasoning summaries
      let currentSummaryText = '';
      let currentSummaryIndex = -1;
      
      for await (const chunk of response) {
        chunkCount++;
        
        // Check for abort signal
        if (abortSignal?.aborted) {
          console.log('AI analysis aborted by signal');
          throw new Error('Analysis cancelled by user');
        }
        
        // Handle reasoning summary text streaming
        if (chunk.type === 'response.reasoning_summary_text.delta') {
          const delta = (chunk as any).delta;
          const summaryIndex = (chunk as any).summary_index;
          
          // If this is a new summary, send the previous one if we had one
          if (summaryIndex !== currentSummaryIndex && currentSummaryText.trim()) {
            const summaryText = currentSummaryText.trim();
            reasoningTokens += summaryText.split(' ').length;
            
            // Extract just the main insight (first sentence or key point)
            const shortSummary = this.extractKeyInsight(summaryText);
            console.log(`🧠 AI: ${shortSummary}`)
            
            // Check abort signal before sending progress update
            if (!abortSignal?.aborted) {
              onProgress?.(summaryText, { 
                phase: 'reasoning',
                step: 'thinking',
                thoughtProcess: summaryText,
                chunksReceived: chunkCount,
                hasSummaryText: true
              })
            }
            
            currentSummaryText = '';
          }
          
          currentSummaryIndex = summaryIndex;
          if (delta) {
            currentSummaryText += delta;
          }
        }
        // Handle complete reasoning summary
        else if (chunk.type === 'response.reasoning_summary_text.done') {
          const summaryText = (chunk as any).text;
          if (summaryText && summaryText.trim()) {
            reasoningTokens += summaryText.split(' ').length;
            
            // Extract just the main insight (first sentence or key point)
            const shortSummary = this.extractKeyInsight(summaryText);
            console.log(`🧠 AI: ${shortSummary}`)
            
            // Check abort signal before sending progress update
            if (!abortSignal?.aborted) {
              onProgress?.(summaryText, { 
                phase: 'reasoning',
                step: 'thinking',
                thoughtProcess: summaryText,
                chunksReceived: chunkCount,
                hasSummaryText: true
              })
            }
          }
        }
        // Silently handle other chunk types to keep streaming alive (no logging)
        else if (chunk.type === 'response.output_text.delta') {
          const delta = (chunk as any).delta;
          if (delta) {
            fullResponse += delta;
            generatedTokens += delta.split(' ').length;
          }
        }
        else if (chunk.type === 'response.output_text.done') {
          const outputText = (chunk as any).output_text;
          if (outputText) {
            fullResponse = outputText;
          }
        }
      }
      
      // Send any remaining summary text
      if (currentSummaryText.trim() && !abortSignal?.aborted) {
        const summaryText = currentSummaryText.trim();
        reasoningTokens += summaryText.split(' ').length;
        console.log(`🧠 AI: ${this.extractKeyInsight(summaryText)}`)
        
        onProgress?.(summaryText, { 
          phase: 'reasoning',
          step: 'thinking',
          thoughtProcess: summaryText,
          chunksReceived: chunkCount,
          hasSummaryText: true
        })
      }

      console.log('Streaming complete, parsing response...')
      onProgress?.('📊 Parsing and validating AI analysis results...', { 
        phase: 'validation',
        step: 'parsing',
        thoughtProcess: 'Validating JSON structure and analysis quality'
      })

      const analysisResult = JSON.parse(fullResponse) as ComprehensiveAnalysisType;

      if (!analysisResult || !analysisResult.biomarker_insights) {
        console.error('Invalid AI analysis response structure:', analysisResult);
        throw new Error("Invalid AI analysis response structure");
      }

      console.log('AI analysis successful:', {
        biomarkerInsights: analysisResult.biomarker_insights.length,
        supplementRecommendations: analysisResult.supplement_recommendations.length,
        dietRecommendations: analysisResult.diet_recommendations.length,
        healthScore: analysisResult.overall_health_assessment.health_score,
        reasoningTokens,
        generatedTokens
      });

      // Only send completion update if not aborted
      if (!abortSignal?.aborted) {
        onProgress?.('✅ Functional medicine analysis completed successfully!', { 
          phase: 'complete',
          step: 'finalization',
          insights: analysisResult.biomarker_insights.length,
          supplements: analysisResult.supplement_recommendations.length,
          dietRecommendations: analysisResult.diet_recommendations.length,
          healthScore: analysisResult.overall_health_assessment.health_score,
          reasoningTokens,
          generatedTokens,
          thoughtProcess: `Successfully generated comprehensive analysis with ${analysisResult.supplement_recommendations.length} supplement recommendations`
        });
      }

      return analysisResult;

    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to calculate biomarker gaps for prioritization
   */
  private calculateBiomarkerGaps(biomarkerReadings: BiomarkerReading[]): any[] {
    return biomarkerReadings.map(reading => {
      if (!reading.optimal_min || !reading.optimal_max) {
        return { ...reading, gap: null, priority: 'unknown' };
      }

      const optimalMid = (reading.optimal_min + reading.optimal_max) / 2;
      const gap = Math.abs(reading.value - optimalMid) / optimalMid;
      
      let priority = 'low';
      if (gap > 0.5) priority = 'critical';
      else if (gap > 0.3) priority = 'high';
      else if (gap > 0.15) priority = 'medium';

      return { ...reading, gap, priority };
    }).sort((a, b) => (b.gap || 0) - (a.gap || 0));
  }

  /**
   * Validate biomarker data before analysis
   */
  private validateBiomarkerData(biomarkerReadings: BiomarkerReading[]): boolean {
    if (!Array.isArray(biomarkerReadings) || biomarkerReadings.length === 0) {
      throw new Error('No biomarker readings provided for analysis');
    }

    const validReadings = biomarkerReadings.filter(reading => 
      reading.value !== null && 
      reading.value !== undefined && 
      !isNaN(reading.value) &&
      reading.unit
    );

    if (validReadings.length === 0) {
      throw new Error('No valid biomarker readings found for analysis');
    }

    return true;
  }

  /**
   * Extracts the key insight (first sentence or main point) from a longer text.
   * This helps in reducing the verbosity of the AI reasoning summaries.
   */
  private extractKeyInsight(text: string): string {
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 0) {
        return firstSentence;
      }
    }
    return text.trim(); // Fallback to the full text if no clear insight
  }

} 