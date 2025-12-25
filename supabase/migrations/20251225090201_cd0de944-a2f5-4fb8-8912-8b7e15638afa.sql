-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing GPA records
CREATE TABLE public.gpa_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semester_name TEXT NOT NULL,
  semester_order INTEGER NOT NULL DEFAULT 1,
  gpa NUMERIC(4,2) NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing courses within each semester
CREATE TABLE public.gpa_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.gpa_records(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  grade TEXT NOT NULL DEFAULT 'O',
  grade_points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gpa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpa_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gpa_records
CREATE POLICY "Students can view own GPA records"
ON public.gpa_records
FOR SELECT
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Students can create own GPA records"
ON public.gpa_records
FOR INSERT
WITH CHECK (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Students can update own GPA records"
ON public.gpa_records
FOR UPDATE
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Students can delete own GPA records"
ON public.gpa_records
FOR DELETE
USING (student_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- RLS Policies for gpa_courses
CREATE POLICY "Students can view own GPA courses"
ON public.gpa_courses
FOR SELECT
USING (record_id IN (
  SELECT id FROM gpa_records WHERE student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Students can create own GPA courses"
ON public.gpa_courses
FOR INSERT
WITH CHECK (record_id IN (
  SELECT id FROM gpa_records WHERE student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Students can update own GPA courses"
ON public.gpa_courses
FOR UPDATE
USING (record_id IN (
  SELECT id FROM gpa_records WHERE student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Students can delete own GPA courses"
ON public.gpa_courses
FOR DELETE
USING (record_id IN (
  SELECT id FROM gpa_records WHERE student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
));

-- Create trigger for updating updated_at
CREATE TRIGGER update_gpa_records_updated_at
BEFORE UPDATE ON public.gpa_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();