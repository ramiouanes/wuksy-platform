-- Migration: Add Processing Status Tracking
-- Date: 2025-11-07
-- Agent: AGENT 2
-- Purpose: Add database infrastructure for background document processing with real-time status updates

-- =============================================================================
-- UP MIGRATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create document_processing_updates table
-- -----------------------------------------------------------------------------
-- This table stores granular processing updates for polling
-- Each row represents a phase in the document processing pipeline

CREATE TABLE IF NOT EXISTS document_processing_updates (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to documents table
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Timestamp of this update
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Processing phase
  -- Possible values: 'queued', 'validation', 'download', 'ocr', 'ai_extraction', 'saving', 'complete', 'error'
  phase TEXT NOT NULL CHECK (phase IN ('queued', 'validation', 'download', 'ocr', 'ai_extraction', 'saving', 'complete', 'error')),
  
  -- Human-readable status message for display
  message TEXT NOT NULL,
  
  -- Additional details (JSON)
  -- For AI thought process, biomarkers found, confidence scores, etc.
  details JSONB DEFAULT '{}'::jsonb
);

-- Add comment for documentation
COMMENT ON TABLE document_processing_updates IS 'Stores real-time processing updates for document processing jobs';
COMMENT ON COLUMN document_processing_updates.phase IS 'Processing phase: queued, validation, download, ocr, ai_extraction, saving, complete, error';
COMMENT ON COLUMN document_processing_updates.message IS 'Human-readable status message displayed to users';
COMMENT ON COLUMN document_processing_updates.details IS 'JSON data for AI thought process, biomarkers found, confidence scores, and other metrics';

-- -----------------------------------------------------------------------------
-- 2. Add new columns to documents table
-- -----------------------------------------------------------------------------
-- These columns track processing timing for analytics and debugging

-- Add processing_started_at column
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- Add processing_completed_at column
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;

-- Add last_update_at column for polling optimization
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN documents.processing_started_at IS 'Timestamp when background processing started';
COMMENT ON COLUMN documents.processing_completed_at IS 'Timestamp when background processing completed (success or failure)';
COMMENT ON COLUMN documents.last_update_at IS 'Timestamp of last processing update (for efficient polling)';

-- -----------------------------------------------------------------------------
-- 3. Create indexes for polling performance
-- -----------------------------------------------------------------------------
-- These indexes optimize the polling queries used by mobile and web apps

-- Index for fetching updates by document_id (most recent first)
CREATE INDEX IF NOT EXISTS idx_processing_updates_document_id 
ON document_processing_updates(document_id, created_at DESC);

-- Index for finding documents currently being processed
CREATE INDEX IF NOT EXISTS idx_documents_last_update 
ON documents(last_update_at DESC) 
WHERE status = 'processing';

-- Index for finding documents by status (for admin monitoring)
CREATE INDEX IF NOT EXISTS idx_documents_status 
ON documents(status);

-- -----------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
-- Users can only access processing updates for their own documents

-- Enable RLS on the new table
ALTER TABLE document_processing_updates ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. Create RLS Policies
-- -----------------------------------------------------------------------------

-- Policy: Users can SELECT updates for their own documents
CREATE POLICY "Users can view own document processing updates"
  ON document_processing_updates
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can INSERT updates (for Supabase Edge Function)
-- Note: Service role bypasses RLS by default, but we define this for clarity
CREATE POLICY "Service role can insert processing updates"
  ON document_processing_updates
  FOR INSERT
  WITH CHECK (true); -- Service role has full access

-- Policy: Service role can UPDATE updates (for corrections/retries)
CREATE POLICY "Service role can update processing updates"
  ON document_processing_updates
  FOR UPDATE
  USING (true); -- Service role has full access

-- Policy: Service role can DELETE updates (for cleanup)
CREATE POLICY "Service role can delete processing updates"
  ON document_processing_updates
  FOR DELETE
  USING (true); -- Service role has full access

-- -----------------------------------------------------------------------------
-- 6. Create function to automatically update last_update_at
-- -----------------------------------------------------------------------------
-- This trigger function updates documents.last_update_at whenever a new
-- processing update is inserted

CREATE OR REPLACE FUNCTION update_document_last_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent document's last_update_at field
  UPDATE documents
  SET last_update_at = NEW.created_at
  WHERE id = NEW.document_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function after each insert
CREATE TRIGGER trigger_update_document_last_update
  AFTER INSERT ON document_processing_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_document_last_update_timestamp();

-- =============================================================================
-- DOWN MIGRATION (ROLLBACK)
-- =============================================================================

-- Uncomment and run these statements to rollback this migration

-- -- Drop trigger and function
-- DROP TRIGGER IF EXISTS trigger_update_document_last_update ON document_processing_updates;
-- DROP FUNCTION IF EXISTS update_document_last_update_timestamp();

-- -- Drop RLS policies
-- DROP POLICY IF EXISTS "Users can view own document processing updates" ON document_processing_updates;
-- DROP POLICY IF EXISTS "Service role can insert processing updates" ON document_processing_updates;
-- DROP POLICY IF EXISTS "Service role can update processing updates" ON document_processing_updates;
-- DROP POLICY IF EXISTS "Service role can delete processing updates" ON document_processing_updates;

-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_processing_updates_document_id;
-- DROP INDEX IF EXISTS idx_documents_last_update;
-- DROP INDEX IF EXISTS idx_documents_status;

-- -- Drop table
-- DROP TABLE IF EXISTS document_processing_updates;

-- -- Remove columns from documents table
-- ALTER TABLE documents DROP COLUMN IF EXISTS processing_started_at;
-- ALTER TABLE documents DROP COLUMN IF EXISTS processing_completed_at;
-- ALTER TABLE documents DROP COLUMN IF EXISTS last_update_at;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Use these queries to verify the migration was successful

-- Check that the table was created
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name = 'document_processing_updates';

-- Check columns in document_processing_updates
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'document_processing_updates'
-- ORDER BY ordinal_position;

-- Check new columns in documents table
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'documents'
-- AND column_name IN ('processing_started_at', 'processing_completed_at', 'last_update_at');

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'document_processing_updates' OR tablename = 'documents'
-- ORDER BY indexname;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'document_processing_updates';




