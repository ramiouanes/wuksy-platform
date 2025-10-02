-- Lifestyle Recommendations Update Migration
-- This migration removes alcohol/hepatotoxins support and adds diet plan recommendations
-- Date: 2025-01-15

-- =====================================================
-- 1. CREATE WORKOUT_RECOMMENDATIONS TABLE
-- =====================================================

-- Create workout recommendations table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS workout_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    
    -- Exercise details
    exercise_type TEXT CHECK (exercise_type IN ('cardiovascular', 'strength_training', 'flexibility', 'general')) DEFAULT 'general',
    specific_exercises TEXT[] DEFAULT '{}',
    
    -- Intensity and duration
    intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')) DEFAULT 'moderate',
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    frequency_per_week INTEGER CHECK (frequency_per_week BETWEEN 1 AND 7),
    rest_days_between INTEGER CHECK (rest_days_between >= 0),
    
    -- Target and reasoning
    target_biomarkers TEXT[] DEFAULT '{}',
    reasoning TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    
    -- Additional guidance
    progression_plan TEXT,
    modifications TEXT,
    safety_considerations TEXT[] DEFAULT '{}',
    
    -- Expected outcomes
    expected_timeline TEXT,
    expected_improvements TEXT,
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for workout recommendations
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_analysis ON workout_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_type ON workout_recommendations(exercise_type);
CREATE INDEX IF NOT EXISTS idx_workout_recommendations_priority ON workout_recommendations(priority);

-- =====================================================
-- 2. CREATE DIET_PLAN_RECOMMENDATIONS TABLE
-- =====================================================

-- Create diet plan recommendations table for structured diet recommendations
CREATE TABLE IF NOT EXISTS diet_plan_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    
    -- Diet plan details
    plan_type TEXT CHECK (plan_type IN ('mediterranean', 'low_carb', 'ketogenic', 'paleo', 'anti_inflammatory', 'elimination', 'intermittent_fasting', 'general')) DEFAULT 'general',
    plan_name TEXT NOT NULL,
    
    -- Macronutrient targets
    carb_percentage INTEGER CHECK (carb_percentage BETWEEN 0 AND 100),
    protein_percentage INTEGER CHECK (protein_percentage BETWEEN 0 AND 100),
    fat_percentage INTEGER CHECK (fat_percentage BETWEEN 0 AND 100),
    
    -- Meal timing and structure
    meals_per_day INTEGER CHECK (meals_per_day BETWEEN 1 AND 6) DEFAULT 3,
    eating_window_hours INTEGER CHECK (eating_window_hours BETWEEN 4 AND 24),
    fasting_hours INTEGER CHECK (fasting_hours BETWEEN 0 AND 20),
    
    -- Food recommendations
    foods_to_include TEXT[] DEFAULT '{}',
    foods_to_avoid TEXT[] DEFAULT '{}',
    portion_guidelines TEXT,
    
    -- Target and reasoning
    target_biomarkers TEXT[] DEFAULT '{}',
    reasoning TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    
    -- Implementation guidance
    implementation_steps TEXT[] DEFAULT '{}',
    meal_prep_tips TEXT,
    shopping_list_suggestions TEXT[] DEFAULT '{}',
    
    -- Expected outcomes
    expected_timeline TEXT,
    expected_improvements TEXT,
    
    -- Monitoring and adjustments
    progress_indicators TEXT[] DEFAULT '{}',
    adjustment_guidelines TEXT,
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT,
    
    -- Safety considerations
    contraindications TEXT[] DEFAULT '{}',
    monitoring_needed TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure macronutrient percentages add up to 100 (with some tolerance)
    CONSTRAINT valid_macronutrient_balance CHECK (
        carb_percentage IS NULL OR protein_percentage IS NULL OR fat_percentage IS NULL OR
        (carb_percentage + protein_percentage + fat_percentage BETWEEN 95 AND 105)
    )
);

-- Create indexes for diet plan recommendations
CREATE INDEX IF NOT EXISTS idx_diet_plan_recommendations_analysis ON diet_plan_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_diet_plan_recommendations_type ON diet_plan_recommendations(plan_type);
CREATE INDEX IF NOT EXISTS idx_diet_plan_recommendations_priority ON diet_plan_recommendations(priority);

-- =====================================================
-- 3. CREATE LIFESTYLE_RECOMMENDATIONS TABLE
-- =====================================================

-- Create general lifestyle recommendations table for other lifestyle factors
CREATE TABLE IF NOT EXISTS lifestyle_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES health_analyses(id) ON DELETE CASCADE,
    
    -- Recommendation details
    category TEXT CHECK (category IN ('sleep', 'stress_management', 'hydration', 'sunlight_exposure', 'social_connection', 'mindfulness', 'environmental', 'general')) NOT NULL,
    recommendation_title TEXT NOT NULL,
    specific_recommendation TEXT NOT NULL,
    
    -- Target and reasoning
    target_biomarkers TEXT[] DEFAULT '{}',
    reasoning TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('essential', 'beneficial', 'optional')) DEFAULT 'beneficial',
    
    -- Implementation guidance
    implementation_steps TEXT[] DEFAULT '{}',
    frequency TEXT, -- e.g., 'daily', 'weekly', '3x per week'
    duration_recommendation TEXT, -- e.g., '7-9 hours', '20 minutes'
    timing_recommendation TEXT, -- e.g., 'evening', 'morning', 'before bed'
    
    -- Expected outcomes
    expected_benefits TEXT,
    expected_timeline TEXT,
    
    -- Tools and resources
    recommended_tools TEXT[] DEFAULT '{}',
    helpful_resources TEXT[] DEFAULT '{}',
    
    -- Scientific backing
    evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')) DEFAULT 'moderate',
    mechanism_of_action TEXT,
    
    -- Safety and considerations
    contraindications TEXT[] DEFAULT '{}',
    special_considerations TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lifestyle recommendations
CREATE INDEX IF NOT EXISTS idx_lifestyle_recommendations_analysis ON lifestyle_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_recommendations_category ON lifestyle_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_lifestyle_recommendations_priority ON lifestyle_recommendations(priority);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE workout_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_recommendations
CREATE POLICY "workout_recommendations_select_policy" ON workout_recommendations 
FOR SELECT USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "workout_recommendations_insert_policy" ON workout_recommendations 
FOR INSERT WITH CHECK (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "workout_recommendations_update_policy" ON workout_recommendations 
FOR UPDATE USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

-- Create RLS policies for diet_plan_recommendations
CREATE POLICY "diet_plan_recommendations_select_policy" ON diet_plan_recommendations 
FOR SELECT USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "diet_plan_recommendations_insert_policy" ON diet_plan_recommendations 
FOR INSERT WITH CHECK (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "diet_plan_recommendations_update_policy" ON diet_plan_recommendations 
FOR UPDATE USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

-- Create RLS policies for lifestyle_recommendations
CREATE POLICY "lifestyle_recommendations_select_policy" ON lifestyle_recommendations 
FOR SELECT USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "lifestyle_recommendations_insert_policy" ON lifestyle_recommendations 
FOR INSERT WITH CHECK (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

CREATE POLICY "lifestyle_recommendations_update_policy" ON lifestyle_recommendations 
FOR UPDATE USING (
    analysis_id IN (
        SELECT id FROM health_analyses WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- 5. CREATE VIEWS FOR COMPREHENSIVE RECOMMENDATIONS
-- =====================================================

-- Create view for all lifestyle-related recommendations
CREATE OR REPLACE VIEW comprehensive_lifestyle_recommendations AS
SELECT 
    'workout' as recommendation_type,
    wr.id,
    wr.analysis_id,
    wr.exercise_type as category,
    'Exercise: ' || wr.exercise_type as title,
    wr.reasoning as description,
    wr.target_biomarkers,
    wr.priority,
    wr.evidence_level,
    wr.expected_timeline,
    wr.created_at
FROM workout_recommendations wr

UNION ALL

SELECT 
    'diet_plan' as recommendation_type,
    dpr.id,
    dpr.analysis_id,
    dpr.plan_type as category,
    'Diet Plan: ' || dpr.plan_name as title,
    dpr.reasoning as description,
    dpr.target_biomarkers,
    dpr.priority,
    dpr.evidence_level,
    dpr.expected_timeline,
    dpr.created_at
FROM diet_plan_recommendations dpr

UNION ALL

SELECT 
    'lifestyle' as recommendation_type,
    lr.id,
    lr.analysis_id,
    lr.category,
    lr.recommendation_title as title,
    lr.specific_recommendation as description,
    lr.target_biomarkers,
    lr.priority,
    lr.evidence_level,
    lr.expected_timeline,
    lr.created_at
FROM lifestyle_recommendations lr

ORDER BY priority DESC, created_at DESC;

-- =====================================================
-- 6. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diet_plan_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lifestyle_recommendations TO authenticated;
GRANT SELECT ON comprehensive_lifestyle_recommendations TO authenticated;

-- Grant permissions for service role (used by API)
GRANT ALL ON workout_recommendations TO service_role;
GRANT ALL ON diet_plan_recommendations TO service_role;
GRANT ALL ON lifestyle_recommendations TO service_role;
GRANT ALL ON comprehensive_lifestyle_recommendations TO service_role;

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to clean up old lifestyle recommendations for an analysis
CREATE OR REPLACE FUNCTION cleanup_lifestyle_recommendations(p_analysis_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Clean up old workout recommendations
    DELETE FROM workout_recommendations 
    WHERE analysis_id = p_analysis_id;
    
    -- Clean up old diet plan recommendations
    DELETE FROM diet_plan_recommendations 
    WHERE analysis_id = p_analysis_id;
    
    -- Clean up old lifestyle recommendations
    DELETE FROM lifestyle_recommendations 
    WHERE analysis_id = p_analysis_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_lifestyle_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_lifestyle_recommendations TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Lifestyle Recommendations Update Migration completed successfully!';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '  ✅ Created workout_recommendations table';
    RAISE NOTICE '  ✅ Created diet_plan_recommendations table';
    RAISE NOTICE '  ✅ Created lifestyle_recommendations table';
    RAISE NOTICE '  ✅ Added comprehensive view for all lifestyle recommendations';
    RAISE NOTICE '  ✅ Configured RLS policies for data security';
    RAISE NOTICE '  ✅ Added helper functions for data management';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for enhanced lifestyle recommendations including diet plans!';
    RAISE NOTICE 'Note: Alcohol and hepatotoxin recommendations are now excluded from the system.';
END $$;
