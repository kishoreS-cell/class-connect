-- Create question_papers table
CREATE TABLE public.question_papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

-- Anyone in the class can view question papers
CREATE POLICY "Class members can view question papers"
ON public.question_papers
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

-- Teachers and students can upload question papers
CREATE POLICY "Users can upload question papers"
ON public.question_papers
FOR INSERT
WITH CHECK (
  uploaded_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own question papers"
ON public.question_papers
FOR DELETE
USING (
  uploaded_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);