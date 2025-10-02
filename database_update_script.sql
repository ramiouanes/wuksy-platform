-- Database Update Script for New Workflow Process
-- This script updates the existing database to support the new workflow where:
-- 1. Biomarkers are extracted and saved with proper names on upload
-- 2. Documents can be listed with their biomarkers
-- 3. Analyses can be triggered manually
-- 4. Structured supplement, diet, and workout recommendations are saved

-- ====================
-- 1. FIX BIOMARKER_READINGS TABLE
-- ====================

-- Add missing biomarker name field (this is the main issue you mentioned)
ALTER TABLE biomarker_readings 
ADD COLUMN biomarker_name TEXT;

-- Add additional fields for better biomarker tracking
ALTER TABLE biomarker_readings 
ADD COLUMN category TEXT DEFAULT 'other';

ALTER TABLE biomarker_readings 
ADD COLUMN reference_range TEXT;

-- Make biomarker_name NOT NULL for new records (existing ones will remain null temporarily)
-- We'll update this constraint after data migration if needed

-- Update the existing constraint to make biomarker_name or biomarker_id required
-- (at least one must be present)
ALTER TABLE biomarker_readings 
ADD CONSTRAINT biomarker_identification_required 
CHECK (biomarker_name IS NOT NULL OR biomarker_id IS NOT NULL);

-- ====================
-- 2. ADD DIET RECOMMENDATIONS TABLE
-- ====================

CREATE TABLE IF NOT EXISTS diet_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    
    -- Diet recommendation details
    category TEXT NOT NULL, -- 'foods_to_increase', 'foods_to_avoid', 'meal_timing', 'hydration', etc.
    recommendation TEXT NOT NULL, -- Detailed recommendation text
    specific_foods TEXT[], -- Array of specific foods mentioned
    
    -- Targeting and reasoning
    target_biomarkers TEXT[], -- Which biomarkers this addresses
    reasoning TEXT NOT NULL, -- Why this dietary change helps
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    
    -- Implementation guidance
    implementation_guidance TEXT, -- How to implement these changes
    portion_guidance TEXT, -- Serving sizes and frequency
    expected_timeline TEXT, -- When to expect benefits
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT, -- How this helps the biomarkers
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- 3. ADD WORKOUT RECOMMENDATIONS TABLE
-- ====================

CREATE TABLE IF NOT EXISTS workout_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    
    -- Workout details
    exercise_type TEXT NOT NULL, -- 'cardiovascular', 'strength_training', 'flexibility', 'hiit', etc.
    specific_exercises TEXT[], -- Array of specific exercises
    intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')) DEFAULT 'moderate',
    
    -- Timing and frequency
    duration_minutes INTEGER, -- Duration per session
    frequency_per_week INTEGER, -- How many times per week
    rest_days_between INTEGER, -- Rest days between sessions
    
    -- Targeting and reasoning
    target_biomarkers TEXT[], -- Which biomarkers this addresses
    reasoning TEXT NOT NULL, -- Why this exercise helps
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    
    -- Implementation guidance
    progression_plan TEXT, -- How to progress over time
    modifications TEXT, -- Modifications for different fitness levels
    safety_considerations TEXT[], -- Safety notes and precautions
    
    -- Expected outcomes
    expected_timeline TEXT, -- When to expect benefits
    expected_improvements TEXT, -- What improvements to expect
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT, -- How this exercise helps the biomarkers
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================
-- 4. UPDATE HEALTH_ANALYSES TABLE
-- ====================

-- Add analysis status tracking for the new workflow
ALTER TABLE health_analyses 
ADD COLUMN status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'completed';

-- Add timestamp for when analysis was started
ALTER TABLE health_analyses 
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;

-- For existing analyses, set them as completed and started_at = created_at
UPDATE health_analyses 
SET status = 'completed', started_at = created_at 
WHERE status IS NULL;

-- ====================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ====================

-- Indexes for biomarker_readings
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_name ON biomarker_readings(biomarker_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_category ON biomarker_readings(category);

-- Indexes for diet_recommendations
CREATE INDEX IF NOT EXISTS idx_diet_recommendations_analysis ON diet_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_diet_recommendations_category ON diet_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_diet_recommendations_priority ON diet_recommendations(priority);

-- Indexes for workout_recommendations
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_analysis ON workout_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_type ON workout_recommendations(exercise_type);
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_priority ON workout_recommendations(priority);

-- Indexes for health_analyses status
CREATE INDEX IF NOT EXISTS idx_health_analyses_status ON health_analyses(status);
CREATE INDEX IF NOT EXISTS idx_health_analyses_document_user ON health_analyses(document_id, user_id);

-- ====================
-- 6. ROW LEVEL SECURITY POLICIES
-- ====================

-- Enable RLS on new tables
ALTER TABLE diet_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_recommendations ENABLE ROW LEVEL SECURITY;

-- Diet recommendations policies
CREATE POLICY "Users can read own diet recommendations" ON diet_recommendations FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

CREATE POLICY "System can insert diet recommendations" ON diet_recommendations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

-- Workout recommendations policies
CREATE POLICY "Users can read own workout recommendations" ON workout_recommendations FOR SELECT USING (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

CREATE POLICY "System can insert workout recommendations" ON workout_recommendations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

-- ====================
-- 7. UPDATE EXISTING BIOMARKER_READINGS (OPTIONAL DATA MIGRATION)
-- ====================

-- This query can help identify biomarker_readings that need names populated
-- You can run this after the schema update to see which records need attention:
/*
SELECT 
    br.id,
    br.biomarker_id,
    br.biomarker_name,
    b.name as db_biomarker_name,
    br.value,
    br.unit,
    d.filename
FROM biomarker_readings br
LEFT JOIN biomarkers b ON br.biomarker_id = b.id
LEFT JOIN documents d ON br.document_id = d.id
WHERE br.biomarker_name IS NULL
ORDER BY br.created_at DESC;
*/

-- If you want to populate missing biomarker names from matched biomarker_id:
-- UPDATE biomarker_readings 
-- SET biomarker_name = (SELECT name FROM biomarkers WHERE id = biomarker_readings.biomarker_id)
-- WHERE biomarker_name IS NULL AND biomarker_id IS NOT NULL;

-- ====================
-- NOTES FOR IMPLEMENTATION
-- ====================

/*
After running this script, the application will need to be updated to:

1. Save biomarker_name when inserting biomarker_readings
2. Save structured supplement recommendations to supplement_recommendations table
3. Save structured diet recommendations to diet_recommendations table  
4. Save structured workout recommendations to workout_recommendations table
5. Update analysis status appropriately during the analysis process

The main changes in the application code will be:
- Update biomarker saving in /api/documents/[id]/process/route.ts to include biomarker_name
- Update analysis saving in /api/analysis/generate-streaming/route.ts to save structured recommendations
- Create documents listing page to show biomarkers and allow manual analysis triggering
- Update dashboard to show documents with their biomarker counts
*/ 