-- Allow students to find classes by class_code (for joining)
CREATE POLICY "Anyone can find classes by code"
ON public.classes
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view classes they are in" ON public.classes;