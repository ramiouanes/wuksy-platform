-- Enhanced Optimal Ranges Migration for WUKSY MVP-2
-- This migration adds support for comprehensive biomarker data from OptimalDX extraction
-- Includes: gender-specific ranges, special conditions, pregnancy, menstrual cycle support

-- =====================================================
-- 1. ENHANCE BIOMARKERS TABLE
-- =====================================================

-- Add missing columns to support enhanced extraction data
ALTER TABLE biomarkers 
ADD COLUMN IF NOT EXISTS formula TEXT,
ADD COLUMN IF NOT EXISTS improved_description TEXT,
ADD COLUMN IF NOT EXISTS extraction_version VARCHAR(20) DEFAULT 'v2.0';

-- Add enhanced source tracking
ALTER TABLE biomarkers 
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}';

-- Update source options to include enhanced extraction
ALTER TABLE biomarkers 
ALTER COLUMN source TYPE TEXT;

-- Add index for better performance on enhanced queries
CREATE INDEX IF NOT EXISTS idx_biomarkers_extraction_version ON biomarkers(extraction_version);
CREATE INDEX IF NOT EXISTS idx_biomarkers_source ON biomarkers(source);

-- =====================================================
-- 2. ENHANCE BIOMARKER_OPTIMAL_RANGES TABLE
-- =====================================================

-- Add new range types for comprehensive support
ALTER TABLE biomarker_optimal_ranges 
ADD COLUMN IF NOT EXISTS special_condition VARCHAR(100),
ADD COLUMN IF NOT EXISTS condition_phase VARCHAR(100),
ADD COLUMN IF NOT EXISTS pregnancy_trimester VARCHAR(50),
ADD COLUMN IF NOT EXISTS cycle_day_range VARCHAR(20);

-- Add metadata for enhanced ranges
ALTER TABLE biomarker_optimal_ranges 
ADD COLUMN IF NOT EXISTS range_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extraction_source VARCHAR(100) DEFAULT 'manual';

-- Update range_type to support new types
ALTER TABLE biomarker_optimal_ranges 
ALTER COLUMN range_type TYPE VARCHAR(50);

-- Add check constraint for new range types
ALTER TABLE biomarker_optimal_ranges 
DROP CONSTRAINT IF EXISTS biomarker_optimal_ranges_range_type_check;

ALTER TABLE biomarker_optimal_ranges 
ADD CONSTRAINT biomarker_optimal_ranges_range_type_check 
CHECK (range_type IN ('optimal', 'functional', 'conventional', 'pregnancy', 'menstrual_cycle', 'special_condition', 'gender_specific'));

-- Add check constraints for special conditions
ALTER TABLE biomarker_optimal_ranges 
ADD CONSTRAINT valid_special_condition 
CHECK (
  special_condition IS NULL OR 
  special_condition IN ('menopausal', 'postmenopausal', 'premenopausal', 'pediatric', 'elderly', 'athletic')
);

ALTER TABLE biomarker_optimal_ranges 
ADD CONSTRAINT valid_condition_phase 
CHECK (
  condition_phase IS NULL OR 
  condition_phase IN ('follicular', 'ovulatory', 'luteal', 'menstrual', 'first_trimester', 'second_trimester', 'third_trimester', 'postpartum')
);

ALTER TABLE biomarker_optimal_ranges 
ADD CONSTRAINT valid_pregnancy_trimester 
CHECK (
  pregnancy_trimester IS NULL OR 
  pregnancy_trimester IN ('first_trimester', 'second_trimester', 'third_trimester', 'postpartum')
);

-- Create indexes for enhanced queries
CREATE INDEX IF NOT EXISTS idx_biomarker_ranges_special_condition ON biomarker_optimal_ranges(special_condition);
CREATE INDEX IF NOT EXISTS idx_biomarker_ranges_condition_phase ON biomarker_optimal_ranges(condition_phase);
CREATE INDEX IF NOT EXISTS idx_biomarker_ranges_pregnancy ON biomarker_optimal_ranges(pregnancy_trimester);
CREATE INDEX IF NOT EXISTS idx_biomarker_ranges_gender_range_type ON biomarker_optimal_ranges(gender, range_type);

-- =====================================================
-- 3. ENHANCE SCIENTIFIC_REFERENCES TABLE
-- =====================================================

-- Add enhanced metadata for better reference management
ALTER TABLE scientific_references 
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_biomarkers UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS impact_factor DECIMAL(5,3);

-- Add full-text search capabilities
ALTER TABLE scientific_references 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_scientific_references_search 
ON scientific_references USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_scientific_references_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.abstract, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.key_findings, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.authors, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS trigger_update_scientific_references_search_vector ON scientific_references;
CREATE TRIGGER trigger_update_scientific_references_search_vector
  BEFORE INSERT OR UPDATE ON scientific_references
  FOR EACH ROW EXECUTE FUNCTION update_scientific_references_search_vector();

-- =====================================================
-- 4. CREATE BIOMARKER_REFERENCE_LINKS TABLE
-- =====================================================

-- Create junction table for many-to-many relationship between biomarkers and references
CREATE TABLE IF NOT EXISTS biomarker_reference_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id UUID REFERENCES biomarkers(id) ON DELETE CASCADE,
    reference_id UUID REFERENCES scientific_references(id) ON DELETE CASCADE,
    range_id UUID REFERENCES biomarker_optimal_ranges(id) ON DELETE CASCADE,
    
    -- Link metadata
    relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10) DEFAULT 5,
    link_type VARCHAR(50) DEFAULT 'general', -- 'range_support', 'description', 'clinical_significance'
    extraction_method VARCHAR(50) DEFAULT 'automated', -- 'automated', 'manual', 'verified'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure unique links
    UNIQUE(biomarker_id, reference_id, range_id)
);

-- Create indexes for biomarker reference links
CREATE INDEX IF NOT EXISTS idx_biomarker_reference_links_biomarker ON biomarker_reference_links(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_reference_links_reference ON biomarker_reference_links(reference_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_reference_links_range ON biomarker_reference_links(range_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_reference_links_type ON biomarker_reference_links(link_type);

-- =====================================================
-- 5. CREATE BIOMARKER_FORMULAS TABLE
-- =====================================================

-- Create table for calculated biomarkers and their formulas
CREATE TABLE IF NOT EXISTS biomarker_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    biomarker_id UUID REFERENCES biomarkers(id) ON DELETE CASCADE,
    
    -- Formula details
    formula_expression TEXT NOT NULL,
    formula_type VARCHAR(50) DEFAULT 'calculation', -- 'calculation', 'ratio', 'index'
    input_biomarkers UUID[] NOT NULL, -- Array of biomarker IDs used in calculation
    
    -- Validation and metadata
    validation_range JSONB, -- Expected result ranges for validation
    formula_description TEXT,
    clinical_interpretation TEXT,
    
    -- Source tracking
    source VARCHAR(100) DEFAULT 'optimaldx',
    extraction_version VARCHAR(20) DEFAULT 'v2.0',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure one formula per biomarker
    UNIQUE(biomarker_id)
);

-- Create indexes for formulas
CREATE INDEX IF NOT EXISTS idx_biomarker_formulas_biomarker ON biomarker_formulas(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_formulas_type ON biomarker_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_biomarker_formulas_input ON biomarker_formulas USING GIN(input_biomarkers);

-- =====================================================
-- 6. UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE biomarker_reference_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_formulas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for biomarker_reference_links
CREATE POLICY "biomarker_reference_links_select_policy" ON biomarker_reference_links FOR SELECT USING (true);
CREATE POLICY "biomarker_reference_links_insert_policy" ON biomarker_reference_links FOR INSERT WITH CHECK (true);
CREATE POLICY "biomarker_reference_links_update_policy" ON biomarker_reference_links FOR UPDATE USING (true);

-- Create RLS policies for biomarker_formulas
CREATE POLICY "biomarker_formulas_select_policy" ON biomarker_formulas FOR SELECT USING (true);
CREATE POLICY "biomarker_formulas_insert_policy" ON biomarker_formulas FOR INSERT WITH CHECK (true);
CREATE POLICY "biomarker_formulas_update_policy" ON biomarker_formulas FOR UPDATE USING (true);

-- =====================================================
-- 7. CREATE HELPFUL VIEWS
-- =====================================================

-- Create view for comprehensive biomarker data with ranges
CREATE OR REPLACE VIEW biomarkers_with_ranges AS
SELECT 
    b.id,
    b.name,
    b.category,
    b.unit,
    b.description,
    b.improved_description,
    b.formula,
    b.source,
    b.extraction_version,
    
    -- Count different types of ranges
    COUNT(CASE WHEN bor.range_type = 'optimal' THEN 1 END) as optimal_ranges_count,
    COUNT(CASE WHEN bor.range_type = 'conventional' THEN 1 END) as conventional_ranges_count,
    COUNT(CASE WHEN bor.range_type = 'pregnancy' THEN 1 END) as pregnancy_ranges_count,
    COUNT(CASE WHEN bor.range_type = 'menstrual_cycle' THEN 1 END) as menstrual_cycle_ranges_count,
    COUNT(CASE WHEN bor.range_type = 'special_condition' THEN 1 END) as special_condition_ranges_count,
    
    -- Gender-specific availability
    bool_or(bor.gender = 'male') as has_male_ranges,
    bool_or(bor.gender = 'female') as has_female_ranges,
    
    -- Reference count
    COUNT(DISTINCT brl.reference_id) as reference_count,
    
    -- Metadata
    b.created_at,
    b.updated_at
    
FROM biomarkers b
LEFT JOIN biomarker_optimal_ranges bor ON b.id = bor.biomarker_id AND bor.is_active = true
LEFT JOIN biomarker_reference_links brl ON b.id = brl.biomarker_id AND brl.is_active = true
WHERE b.is_active = true
GROUP BY b.id, b.name, b.category, b.unit, b.description, b.improved_description, 
         b.formula, b.source, b.extraction_version, b.created_at, b.updated_at;

-- Create view for range recommendations based on user profile
CREATE OR REPLACE VIEW user_specific_ranges AS
SELECT 
    bor.id,
    bor.biomarker_id,
    b.name as biomarker_name,
    bor.range_type,
    bor.gender,
    bor.special_condition,
    bor.condition_phase,
    bor.pregnancy_trimester,
    bor.optimal_min,
    bor.optimal_max,
    bor.functional_min,
    bor.functional_max,
    bor.confidence_level,
    bor.evidence_level,
    bor.is_primary,
    bor.usage_notes,
    
    -- Priority scoring (higher = more specific/relevant)
    CASE 
        WHEN bor.pregnancy_trimester IS NOT NULL THEN 100
        WHEN bor.condition_phase IS NOT NULL THEN 90
        WHEN bor.special_condition IS NOT NULL THEN 80
        WHEN bor.gender IS NOT NULL THEN 70
        WHEN bor.is_primary = true THEN 60
        ELSE 50
    END as priority_score
    
FROM biomarker_optimal_ranges bor
JOIN biomarkers b ON bor.biomarker_id = b.id
WHERE bor.is_active = true AND b.is_active = true;

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to cleanup orphaned references
CREATE OR REPLACE FUNCTION cleanup_orphaned_references()
RETURNS VOID AS $$
BEGIN
    -- Delete scientific references that are not linked to any biomarkers
    DELETE FROM scientific_references 
    WHERE id NOT IN (
        SELECT DISTINCT reference_id 
        FROM biomarker_reference_links 
        WHERE reference_id IS NOT NULL
    )
    AND id NOT IN (
        SELECT DISTINCT unnest(scientific_references) 
        FROM biomarker_optimal_ranges 
        WHERE scientific_references IS NOT NULL 
        AND scientific_references != '{}'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get most relevant range for a user
CREATE OR REPLACE FUNCTION get_optimal_range_for_user(
    p_biomarker_id UUID,
    p_gender TEXT DEFAULT NULL,
    p_age INTEGER DEFAULT NULL,
    p_menstrual_phase TEXT DEFAULT NULL,
    p_pregnancy_status TEXT DEFAULT NULL,
    p_menopause_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    range_id UUID,
    range_type TEXT,
    optimal_min DECIMAL,
    optimal_max DECIMAL,
    usage_notes TEXT,
    priority_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bor.id,
        bor.range_type,
        bor.optimal_min,
        bor.optimal_max,
        bor.usage_notes,
        CASE 
            -- Pregnancy takes highest priority
            WHEN p_pregnancy_status = 'pregnant' AND bor.pregnancy_trimester IS NOT NULL THEN 100
            -- Menstrual phase specific
            WHEN p_menstrual_phase IS NOT NULL AND bor.condition_phase = p_menstrual_phase THEN 90
            -- Menopause status
            WHEN p_menopause_status IS NOT NULL AND bor.special_condition = p_menopause_status THEN 85
            -- Gender specific
            WHEN p_gender IS NOT NULL AND bor.gender = p_gender THEN 70
            -- Age specific
            WHEN p_age IS NOT NULL AND bor.age_min <= p_age AND (bor.age_max IS NULL OR bor.age_max >= p_age) THEN 60
            -- Primary range
            WHEN bor.is_primary = true THEN 50
            ELSE 40
        END as priority_score
    FROM biomarker_optimal_ranges bor
    WHERE bor.biomarker_id = p_biomarker_id 
        AND bor.is_active = true
    ORDER BY priority_score DESC, bor.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. UPDATE EXISTING DATA (SAFE OPERATIONS)
-- =====================================================

-- Update extraction_version for existing data
UPDATE biomarkers 
SET extraction_version = 'v1.0' 
WHERE extraction_version IS NULL;

-- Update range metadata for existing ranges
UPDATE biomarker_optimal_ranges 
SET extraction_source = 'manual'
WHERE extraction_source IS NULL;

-- =====================================================
-- 10. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE, DELETE ON biomarker_reference_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON biomarker_formulas TO authenticated;
GRANT SELECT ON biomarkers_with_ranges TO authenticated;
GRANT SELECT ON user_specific_ranges TO authenticated;
GRANT EXECUTE ON FUNCTION get_optimal_range_for_user TO authenticated;

-- Grant permissions for service role (used by extraction system)
GRANT ALL ON biomarker_reference_links TO service_role;
GRANT ALL ON biomarker_formulas TO service_role;
GRANT ALL ON biomarkers_with_ranges TO service_role;
GRANT ALL ON user_specific_ranges TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Optimal Ranges Migration completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '  ✅ Enhanced biomarker ranges with gender, pregnancy, menstrual cycle support';
    RAISE NOTICE '  ✅ Scientific references with full-text search';
    RAISE NOTICE '  ✅ Biomarker formulas for calculated values';
    RAISE NOTICE '  ✅ Comprehensive views and helper functions';
    RAISE NOTICE '  ✅ Optimized indexes for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for OptimalDX data import!';
END $$;
