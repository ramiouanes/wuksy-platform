import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  last_login_at?: string
  data_consent: boolean
  research_consent: boolean
}

export interface UserDemographicProfile {
  id: string
  user_id: string
  gender: 'male' | 'female' | 'other'
  date_of_birth: string
  current_age: number
  menstrual_cycle_length?: number
  last_menstrual_period?: string
  current_menstrual_phase?: string
  pregnancy_status?: 'not_pregnant' | 'pregnant' | 'postpartum'
  menopause_status?: 'premenopausal' | 'perimenopausal' | 'postmenopausal'
  ethnicity?: string
  bmi?: number
  health_conditions?: string[]
  medications?: string[]
  lifestyle_factors?: any
  supplement_preferences?: any
  created_at: string
  updated_at: string
}

export interface Biomarker {
  id: string
  name: string
  aliases?: string[]
  category: string
  subcategory?: string
  unit: string
  conventional_min?: number
  conventional_max?: number
  description?: string
  improved_description?: string
  clinical_significance?: string
  formula?: string
  testing_method?: string
  fasting_required?: boolean
  source?: string
  source_url?: string
  extraction_version?: string
  last_verified?: string
  related_biomarkers?: string[]
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface BiomarkerOptimalRange {
  id: string
  biomarker_id: string
  gender?: string
  age_min?: number
  age_max?: number
  menstrual_phase?: string
  pregnancy_status?: string
  additional_criteria?: any
  optimal_min: number
  optimal_max: number
  functional_min?: number
  functional_max?: number
  range_type: string
  confidence_level: string
  population_studied?: string
  scientific_references?: string[]
  evidence_level: string
  is_primary: boolean
  usage_notes?: string
  last_updated?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface ScientificReference {
  id: string
  title: string
  authors: string
  journal: string
  publication_year: number
  pubmed_id?: string
  doi?: string
  url?: string
  study_type: string
  evidence_quality: string
  key_findings?: string
  abstract?: string
  link_type?: string
  relevance_score?: number
}

export interface EnrichedBiomarker extends Biomarker {
  optimal_ranges: BiomarkerOptimalRange[]
  scientific_references: ScientificReference[]
}

export interface BiomarkersResponse {
  biomarkers: EnrichedBiomarker[]
  biomarkers_by_category: Record<string, EnrichedBiomarker[]>
  categories: string[]
  total_count: number
  metadata: {
    total_biomarkers: number
    biomarkers_with_optimal_ranges: number
    biomarkers_with_references: number
    categories_count: number
  }
}

export interface HealthAnalysis {
  id: string
  user_id: string
  document_id?: string
  overall_health_score: number
  health_category: 'poor' | 'fair' | 'good' | 'excellent'
  biomarker_insights: any[]
  root_causes: any[]
  recommendations_summary: any
  warnings: any[]
  disclaimers: string[]
  demographic_context: any
  evidence_summary: any
  processing_time: number
  biomarker_readings?: any[]  // Enhanced biomarker data with detailed info, ranges, and references
  biomarkers_by_category?: Record<string, any[]>  // Biomarkers grouped by category
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  filename: string
  filesize: number
  mimetype: string
  storage_path: string
  uploaded_at: string
  processed_at?: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  ocr_data?: any
  extracted_biomarkers?: any[]
  processing_metadata?: any
  ocr_confidence?: number
  extraction_method?: 'ai_enhanced' | 'pattern_matching' | 'failed'
  document_type?: string
}

export interface SupplementRecommendation {
  id: string
  analysis_id: string
  supplement_name: string
  dosage_amount: number
  dosage_unit: string
  frequency: string
  timing: string
  duration_weeks: number
  priority: 'essential' | 'beneficial' | 'optional'
  reason: string
  target_biomarkers: string[]
  evidence_level: string
  scientific_references?: string[]
  mechanism_of_action?: string
  clinical_rationale?: string
  contraindications?: string[]
  drug_interactions?: string[]
  side_effects?: string[]
  monitoring_needed?: string[]
  estimated_cost: number
  created_at: string
}

export interface DietRecommendation {
  id: string
  analysis_id: string
  category: string
  recommendation: string
  specific_foods: string[]
  target_biomarkers: string[]
  reasoning: string
  priority: 'essential' | 'beneficial' | 'optional'
  implementation_guidance?: string
  portion_guidance?: string
  expected_timeline?: string
  evidence_level: 'strong' | 'moderate' | 'limited' | 'expert_opinion'
  mechanism_of_action?: string
  created_at: string
}

export interface WorkoutRecommendation {
  id: string
  analysis_id: string
  exercise_type: string
  specific_exercises: string[]
  intensity: 'low' | 'moderate' | 'high'
  duration_minutes?: number
  frequency_per_week?: number
  rest_days_between?: number
  target_biomarkers: string[]
  reasoning: string
  priority: 'essential' | 'beneficial' | 'optional'
  progression_plan?: string
  modifications?: string
  safety_considerations?: string[]
  expected_timeline?: string
  expected_improvements?: string
  evidence_level: 'strong' | 'moderate' | 'limited' | 'expert_opinion'
  mechanism_of_action?: string
  created_at: string
}

export interface DietPlanRecommendation {
  id: string
  analysis_id: string
  plan_type: 'mediterranean' | 'low_carb' | 'ketogenic' | 'paleo' | 'anti_inflammatory' | 'elimination' | 'intermittent_fasting' | 'general'
  plan_name: string
  carb_percentage?: number
  protein_percentage?: number
  fat_percentage?: number
  meals_per_day?: number
  eating_window_hours?: number
  fasting_hours?: number
  foods_to_include: string[]
  foods_to_avoid: string[]
  portion_guidelines?: string
  target_biomarkers: string[]
  reasoning: string
  priority: 'essential' | 'beneficial' | 'optional'
  implementation_steps: string[]
  meal_prep_tips?: string
  shopping_list_suggestions: string[]
  expected_timeline?: string
  expected_improvements?: string
  progress_indicators: string[]
  adjustment_guidelines?: string
  evidence_level: 'strong' | 'moderate' | 'limited' | 'expert_opinion'
  mechanism_of_action?: string
  contraindications: string[]
  monitoring_needed: string[]
  created_at: string
}

export interface LifestyleRecommendation {
  id: string
  analysis_id: string
  category: 'sleep' | 'stress_management' | 'hydration' | 'sunlight_exposure' | 'social_connection' | 'mindfulness' | 'environmental' | 'general'
  recommendation_title: string
  specific_recommendation: string
  target_biomarkers: string[]
  reasoning: string
  priority: 'essential' | 'beneficial' | 'optional'
  implementation_steps: string[]
  frequency?: string
  duration_recommendation?: string
  timing_recommendation?: string
  expected_benefits?: string
  expected_timeline?: string
  recommended_tools: string[]
  helpful_resources: string[]
  evidence_level: 'strong' | 'moderate' | 'limited' | 'expert_opinion'
  mechanism_of_action?: string
  contraindications: string[]
  special_considerations?: string
  created_at: string
}

export interface BiomarkerReading {
  id: string
  user_id: string
  document_id: string
  analysis_id?: string
  biomarker_id?: string
  biomarker_name: string
  value: number
  unit: string
  category: string
  reference_range?: string
  status?: 'deficient' | 'suboptimal' | 'optimal' | 'excess' | 'concerning'
  severity?: 'mild' | 'moderate' | 'severe'
  confidence: number
  matched_from_db: boolean
  source_text?: string
  extracted_at: string
  created_at: string
}

export interface DocumentWithBiomarkers {
  id: string
  user_id: string
  filename: string
  filesize: number
  mimetype: string
  uploaded_at: string
  processed_at?: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  biomarker_readings: BiomarkerReading[]
  analysis?: HealthAnalysis
}