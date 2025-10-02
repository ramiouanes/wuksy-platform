-- Fix biomarker_readings table to support immediate saving after extraction
-- Make analysis_id nullable so we can save biomarkers before analysis

ALTER TABLE biomarker_readings 
ALTER COLUMN analysis_id DROP NOT NULL;

-- Add document_id to link biomarkers directly to documents
ALTER TABLE biomarker_readings 
ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE CASCADE;

-- Add user_id for direct access control
ALTER TABLE biomarker_readings 
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add extraction metadata
ALTER TABLE biomarker_readings 
ADD COLUMN extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add confidence score from extraction
ALTER TABLE biomarker_readings 
ADD COLUMN confidence DECIMAL(5,3);

-- Add matched_from_db flag
ALTER TABLE biomarker_readings 
ADD COLUMN matched_from_db BOOLEAN DEFAULT FALSE;

-- Add source_text for debugging
ALTER TABLE biomarker_readings 
ADD COLUMN source_text TEXT;

-- Make status and severity nullable (will be filled during analysis)
ALTER TABLE biomarker_readings 
ALTER COLUMN status DROP NOT NULL;

ALTER TABLE biomarker_readings 
ALTER COLUMN severity DROP NOT NULL;

-- Create index on document_id for faster queries
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_document ON biomarker_readings(document_id);

-- Create index on user_id for faster queries  
CREATE INDEX IF NOT EXISTS idx_biomarker_readings_user ON biomarker_readings(user_id);

-- Update RLS policy to allow users to read biomarkers from their documents
CREATE POLICY "Users can read biomarkers from own documents" ON biomarker_readings FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid())
);

-- Update RLS policy to allow users to insert biomarkers for their documents
CREATE POLICY "Users can insert biomarkers for own documents" ON biomarker_readings FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid())
);

-- Update RLS policy to allow users to update biomarkers for their documents (for analysis updates)
CREATE POLICY "Users can update biomarkers for own documents" ON biomarker_readings FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM documents WHERE id = document_id AND user_id = auth.uid())
); 