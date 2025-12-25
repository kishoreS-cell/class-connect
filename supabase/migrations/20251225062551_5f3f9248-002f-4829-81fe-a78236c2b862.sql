-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT NOT NULL UNIQUE,
  cover_color TEXT DEFAULT '#E07A5F',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create class_members table (students joining classes)
CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(class_id, student_id)
);

-- Create notes table (teacher uploads)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_points INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  text_content TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(assignment_id, student_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Classes policies
CREATE POLICY "Anyone can view classes they are in" ON public.classes FOR SELECT TO authenticated 
  USING (
    teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR id IN (SELECT class_id FROM public.class_members WHERE student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Teachers can create classes" ON public.classes FOR INSERT TO authenticated 
  WITH CHECK (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE TO authenticated 
  USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete own classes" ON public.classes FOR DELETE TO authenticated 
  USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Class members policies
CREATE POLICY "View class members" ON public.class_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can join classes" ON public.class_members FOR INSERT TO authenticated 
  WITH CHECK (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Students can leave classes" ON public.class_members FOR DELETE TO authenticated 
  USING (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Notes policies
CREATE POLICY "Class members can view notes" ON public.notes FOR SELECT TO authenticated 
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      UNION
      SELECT class_id FROM public.class_members WHERE student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Teachers can create notes" ON public.notes FOR INSERT TO authenticated 
  WITH CHECK (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can delete notes" ON public.notes FOR DELETE TO authenticated 
  USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Assignments policies
CREATE POLICY "Class members can view assignments" ON public.assignments FOR SELECT TO authenticated 
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      UNION
      SELECT class_id FROM public.class_members WHERE student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Teachers can create assignments" ON public.assignments FOR INSERT TO authenticated 
  WITH CHECK (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'teacher'));
CREATE POLICY "Teachers can update assignments" ON public.assignments FOR UPDATE TO authenticated 
  USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete assignments" ON public.assignments FOR DELETE TO authenticated 
  USING (teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Submissions policies
CREATE POLICY "Students can view own submissions" ON public.submissions FOR SELECT TO authenticated 
  USING (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Students can create submissions" ON public.submissions FOR INSERT TO authenticated 
  WITH CHECK (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Students can update own submissions" ON public.submissions FOR UPDATE TO authenticated 
  USING (student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can grade submissions" ON public.submissions FOR UPDATE TO authenticated 
  USING (assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated 
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique class code
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('class-files', 'class-files', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'class-files');
CREATE POLICY "Anyone can view class files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'class-files');
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'class-files');