
-- Create a storage bucket for general user uploads (cloud storage feature)
INSERT INTO storage.buckets (id, name, public) VALUES ('cloud-storage', 'cloud-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to cloud-storage
CREATE POLICY "Auth users can upload to cloud-storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cloud-storage');

-- Allow anyone to view cloud-storage files
CREATE POLICY "Anyone can view cloud-storage files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cloud-storage');

-- Allow authenticated users to delete from cloud-storage
CREATE POLICY "Auth users can delete from cloud-storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cloud-storage');
