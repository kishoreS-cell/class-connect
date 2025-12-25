-- Create student_notes table for personal notes
CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies - students can only access their own notes
CREATE POLICY "Students can view own notes" 
ON public.student_notes FOR SELECT 
USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own notes" 
ON public.student_notes FOR INSERT 
WITH CHECK (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own notes" 
ON public.student_notes FOR UPDATE 
USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students can delete own notes" 
ON public.student_notes FOR DELETE 
USING (student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_student_notes_updated_at
BEFORE UPDATE ON public.student_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();