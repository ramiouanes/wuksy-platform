-- Fix missing INSERT policy for supplement_recommendations table
-- This resolves the "new row violates row-level security policy" error

-- Add INSERT policy for supplement_recommendations
CREATE POLICY "System can insert supplement recommendations" ON supplement_recommendations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);

-- Also add UPDATE policy in case users want to accept/reject recommendations
CREATE POLICY "Users can update own supplement recommendations" ON supplement_recommendations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM health_analyses WHERE id = analysis_id AND user_id = auth.uid())
);
