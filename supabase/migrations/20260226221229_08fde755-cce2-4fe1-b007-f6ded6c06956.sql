
-- Fix permissive INSERT policies
DROP POLICY "System can insert audit log" ON public.audit_log;
CREATE POLICY "Authenticated can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "Authenticated can insert downtime" ON public.downtime_events;
CREATE POLICY "Authenticated can insert downtime" ON public.downtime_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
