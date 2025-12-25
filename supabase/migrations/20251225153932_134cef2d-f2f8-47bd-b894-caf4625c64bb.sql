-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  student_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teachers can view attendance for their classes
CREATE POLICY "Teachers can view class attendance"
ON public.attendance
FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Teachers can mark attendance
CREATE POLICY "Teachers can mark attendance"
ON public.attendance
FOR INSERT
WITH CHECK (
  marked_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Teachers can update attendance
CREATE POLICY "Teachers can update attendance"
ON public.attendance
FOR UPDATE
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Teachers can delete attendance
CREATE POLICY "Teachers can delete attendance"
ON public.attendance
FOR DELETE
USING (
  class_id IN (
    SELECT id FROM classes 
    WHERE teacher_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
ON public.attendance
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);