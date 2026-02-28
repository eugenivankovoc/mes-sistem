-- Enable realtime for part_feedback and orders tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.part_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Allow authenticated users to insert notifications (for rework alerts)
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
