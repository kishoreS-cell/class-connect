-- Add foreign key constraint for uploaded_by
ALTER TABLE public.question_papers 
ADD CONSTRAINT question_papers_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE;