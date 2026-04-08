
DROP POLICY "Visitors can create requests" ON public.visitor_requests;
CREATE POLICY "Authenticated users can create requests" ON public.visitor_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
