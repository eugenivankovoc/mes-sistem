-- Add material_filter column to batches table
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS material_filter text;

-- Add batch_id column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id);

-- Create index for batch_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON public.orders(batch_id);

-- Allow operators to read batches (already exists), ensure staff can manage
-- Policies already exist from initial setup