-- =============================================================================
-- 0002 — Soporte de fotos: columna en bonos + bucket Storage configurado
-- =============================================================================

-- 1. photoUrl en bonos
ALTER TABLE bonos ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Bucket de Supabase Storage (público en lectura, escritura autenticada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equmanager',
  'equmanager',
  true,
  10485760, -- 10 MB
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Políticas RLS para el bucket
DROP POLICY IF EXISTS "equmanager_public_read" ON storage.objects;
CREATE POLICY "equmanager_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'equmanager');

DROP POLICY IF EXISTS "equmanager_auth_insert" ON storage.objects;
CREATE POLICY "equmanager_auth_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equmanager');

DROP POLICY IF EXISTS "equmanager_auth_update" ON storage.objects;
CREATE POLICY "equmanager_auth_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equmanager');

DROP POLICY IF EXISTS "equmanager_auth_delete" ON storage.objects;
CREATE POLICY "equmanager_auth_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'equmanager');
