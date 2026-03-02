ALTER TABLE public.notifications ADD COLUMN reference_id uuid DEFAULT NULL;
ALTER TABLE public.notifications ADD COLUMN reference_table text DEFAULT NULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;