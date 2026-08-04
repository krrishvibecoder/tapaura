ALTER TABLE public.clients RENAME COLUMN logo_url TO logo_path;

CREATE POLICY "logos_owner_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-logos' AND (storage.foldername(name))[1] = auth.uid()::text);