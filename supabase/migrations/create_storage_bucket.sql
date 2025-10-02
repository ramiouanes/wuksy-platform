-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload their own documents
CREATE POLICY "Users can upload their own documents" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for users to view their own documents  
CREATE POLICY "Users can view their own documents" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for users to update their own documents
CREATE POLICY "Users can update their own documents" ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]); 