-- Add missing columns to documents table for enhanced OCR processing

-- Add processing_metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' 
                   AND column_name = 'processing_metadata') THEN
        ALTER TABLE documents ADD COLUMN processing_metadata JSONB;
    END IF;
END $$;

-- Add additional metadata columns for enhanced processing tracking
DO $$ 
BEGIN
    -- Add OCR confidence tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' 
                   AND column_name = 'ocr_confidence') THEN
        ALTER TABLE documents ADD COLUMN ocr_confidence DECIMAL(3,2);
    END IF;
    
    -- Add extraction method tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' 
                   AND column_name = 'extraction_method') THEN
        ALTER TABLE documents ADD COLUMN extraction_method TEXT CHECK (extraction_method IN ('ai_enhanced', 'pattern_matching', 'failed'));
    END IF;
    
    -- Add document type detection
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' 
                   AND column_name = 'document_type') THEN
        ALTER TABLE documents ADD COLUMN document_type TEXT;
    END IF;
END $$;

-- Create index for better performance on uploaded_at queries (using the existing column)
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC); 