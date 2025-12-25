-- Drop the old student policy
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;

-- Create new policy allowing students to view all attendance in their classes
CREATE POLICY "Students can view class attendance"
ON public.attendance
FOR SELECT
USING (
  class_id IN (
    SELECT class_members.class_id
    FROM class_members
    WHERE class_members.student_id IN (
      SELECT profiles.id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )
  )
);