-- Allow teachers to remove students from their own classes
CREATE POLICY "Teachers can remove students from own classes"
ON public.class_members FOR DELETE
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id IN (
      SELECT id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  )
);