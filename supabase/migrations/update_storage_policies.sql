-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Simpler policies that should work with the file path structure
CREATE POLICY "Enable insert for authenticated users own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Enable select for authenticated users own folder" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Enable update for authenticated users own folder" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Enable delete for authenticated users own folder" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (string_to_array(name, '/'))[1]
); 