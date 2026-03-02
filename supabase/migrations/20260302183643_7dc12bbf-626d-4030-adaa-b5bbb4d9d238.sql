
-- Add missing columns to parts
ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS edge_top text,
  ADD COLUMN IF NOT EXISTS edge_bottom text,
  ADD COLUMN IF NOT EXISTS edge_left text,
  ADD COLUMN IF NOT EXISTS edge_right text,
  ADD COLUMN IF NOT EXISTS cnc_program text,
  ADD COLUMN IF NOT EXISTS is_rework boolean NOT NULL DEFAULT false;

-- Add order_name to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_name text;

-- Add operation_type and feedback_method to part_feedback
ALTER TABLE public.part_feedback
  ADD COLUMN IF NOT EXISTS operation_type text,
  ADD COLUMN IF NOT EXISTS feedback_method text;

-- Add type to workstations
ALTER TABLE public.workstations
  ADD COLUMN IF NOT EXISTS type text;

-- Create rework-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('rework-photos', 'rework-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: operators can upload to rework-photos
CREATE POLICY "Operators can upload rework photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rework-photos'
  AND public.has_role(auth.uid(), 'operator')
);

-- RLS: authenticated can read rework photos
CREATE POLICY "Authenticated can read rework photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'rework-photos');
