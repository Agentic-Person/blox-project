-- Create public storage buckets used by profile features
-- Note: In Supabase, buckets are usually created via the dashboard or REST API.
-- This script ensures policies exist and documents required buckets.

-- Required buckets (create if missing via API or dashboard):
--  - avatars (public)
--  - portfolio (public)
--  - recent-work (public)

-- Policies for storage.objects to allow public read and user write
-- These policies apply across buckets; we scope writes to the user's folder path

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access to images'
  ) THEN
    CREATE POLICY "Public read access to images"
      ON storage.objects FOR SELECT
      USING (
        bucket_id IN ('avatars','portfolio','recent-work')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to own folder'
  ) THEN
    CREATE POLICY "Users can upload to own folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update/delete own files'
  ) THEN
    CREATE POLICY "Users can update/delete own files"
      ON storage.objects FOR UPDATE USING (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      )
      WITH CHECK (
        bucket_id IN ('avatars','portfolio','recent-work')
        AND (auth.uid() IS NOT NULL)
        AND (position(auth.uid()::text || '/' in name) = 1)
      );
  END IF;
END $$;


