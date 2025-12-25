-- Create recorded_videos table
CREATE TABLE public.recorded_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recorded_videos ENABLE ROW LEVEL SECURITY;

-- RLS policies - class members can view videos
CREATE POLICY "Class members can view videos" 
ON public.recorded_videos FOR SELECT 
USING (class_id IN (
  SELECT id FROM classes WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  UNION
  SELECT class_id FROM class_members WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

-- Both teachers and students can upload videos
CREATE POLICY "Class members can upload videos" 
ON public.recorded_videos FOR INSERT 
WITH CHECK (
  uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    UNION
    SELECT class_id FROM class_members WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos" 
ON public.recorded_videos FOR DELETE 
USING (uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));