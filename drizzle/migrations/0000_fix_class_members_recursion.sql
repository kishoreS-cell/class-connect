DROP POLICY IF EXISTS "Class participants can view members" ON public.class_members;
CREATE POLICY "Class participants can view members" ON public.class_members
FOR SELECT TO authenticated USING (public.can_view_class(auth.uid(), class_id));