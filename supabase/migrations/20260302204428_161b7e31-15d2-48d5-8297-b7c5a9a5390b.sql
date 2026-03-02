
-- Add requires_* boolean columns to parts table for workstation routing
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_cutting boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_edgebanding boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_cnc boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_drilling boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_sorting boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_assembly boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_quality_check boolean NOT NULL DEFAULT false;
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS requires_packaging boolean NOT NULL DEFAULT false;
