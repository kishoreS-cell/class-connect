-- Create table for daily syllabus strategies
CREATE TABLE public.syllabus_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.syllabus_strategies ENABLE ROW LEVEL SECURITY;

-- Teachers can create strategies for their classes
CREATE POLICY "Teachers can create strategies"
ON public.syllabus_strategies
FOR INSERT
WITH CHECK (
  teacher_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ) AND
  class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Teachers can update their own strategies
CREATE POLICY "Teachers can update own strategies"
ON public.syllabus_strategies
FOR UPDATE
USING (
  teacher_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Teachers can delete their own strategies
CREATE POLICY "Teachers can delete own strategies"
ON public.syllabus_strategies
FOR DELETE
USING (
  teacher_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Both teachers and students can view strategies for their classes
CREATE POLICY "Class members can view strategies"
ON public.syllabus_strategies
FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    UNION
    SELECT class_id FROM class_members WHERE student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_syllabus_strategies_updated_at
BEFORE UPDATE ON public.syllabus_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();