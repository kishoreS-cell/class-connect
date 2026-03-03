
-- 1. Fix profiles: restrict SELECT to own profile + class-related profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_user_id uuid, _target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Can always view own profile
    SELECT 1 FROM profiles WHERE id = _target_profile_id AND user_id = _viewer_user_id
  )
  OR EXISTS (
    -- Viewer is a student, target is teacher of one of their classes
    SELECT 1 FROM class_members cm
    JOIN profiles vp ON vp.id = cm.student_id AND vp.user_id = _viewer_user_id
    JOIN classes c ON c.id = cm.class_id AND c.teacher_id = _target_profile_id
  )
  OR EXISTS (
    -- Viewer is a teacher, target is student in one of their classes
    SELECT 1 FROM classes c
    JOIN profiles vp ON vp.id = c.teacher_id AND vp.user_id = _viewer_user_id
    JOIN class_members cm ON cm.class_id = c.id AND cm.student_id = _target_profile_id
  )
  OR EXISTS (
    -- Viewer and target are students in the same class
    SELECT 1 FROM class_members cm1
    JOIN profiles vp ON vp.id = cm1.student_id AND vp.user_id = _viewer_user_id
    JOIN class_members cm2 ON cm2.class_id = cm1.class_id AND cm2.student_id = _target_profile_id
  )
  OR EXISTS (
    -- Viewer is a student, target is a teacher of a class they're in (reverse direction)
    SELECT 1 FROM classes c
    JOIN class_members cm ON cm.class_id = c.id
    JOIN profiles vp ON vp.id = cm.student_id AND vp.user_id = _viewer_user_id
    WHERE c.teacher_id = _target_profile_id
  );
$$;

CREATE POLICY "Users can view related profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.can_view_profile(auth.uid(), id));

-- 2. Fix classes: restrict to authenticated users who are members or searching by code
DROP POLICY IF EXISTS "Anyone can find classes by code" ON public.classes;

CREATE POLICY "Authenticated users can view their classes"
ON public.classes FOR SELECT TO authenticated
USING (
  -- Teacher owns the class
  teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- Student is a member
  id IN (SELECT class_id FROM class_members WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR
  -- Allow lookup by class_code for joining (class_code must be provided in query filter)
  true = false -- placeholder, handled by RPC or direct code lookup
);

-- Actually, students need to find classes by code to join. Let's use a security definer function instead.
DROP POLICY IF EXISTS "Authenticated users can view their classes" ON public.classes;

CREATE OR REPLACE FUNCTION public.can_view_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes WHERE id = _class_id AND teacher_id IN (SELECT id FROM profiles WHERE user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM class_members WHERE class_id = _class_id AND student_id IN (SELECT id FROM profiles WHERE user_id = _user_id)
  );
$$;

CREATE POLICY "Users can view own classes"
ON public.classes FOR SELECT TO authenticated
USING (public.can_view_class(auth.uid(), id));

-- For joining by code, create a security definer function
CREATE OR REPLACE FUNCTION public.find_class_by_code(_code text)
RETURNS TABLE(id uuid, name text, description text, teacher_id uuid, class_code text, cover_color text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.description, c.teacher_id, c.class_code, c.cover_color, c.created_at
  FROM classes c WHERE c.class_code = _code;
$$;

-- 3. Fix class_members: restrict SELECT to class participants
DROP POLICY IF EXISTS "View class members" ON public.class_members;

CREATE POLICY "Class participants can view members"
ON public.class_members FOR SELECT TO authenticated
USING (
  class_id IN (
    SELECT id FROM classes WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    UNION
    SELECT class_id FROM class_members WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- 4. Fix notifications: remove permissive insert, create security definer function
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.create_system_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 5. Fix storage: make class-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'class-files';
UPDATE storage.buckets SET public = false WHERE id = 'cloud-storage';
