
CREATE POLICY "Allow profile creation"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
