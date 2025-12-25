-- Create messages table for chat between students and teachers
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  class_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can update their received messages (mark as read)
CREATE POLICY "Users can update received messages"
ON public.messages
FOR UPDATE
USING (
  receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Create call_sessions table for video/voice calls
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  class_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  call_type TEXT NOT NULL DEFAULT 'video',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their call sessions
CREATE POLICY "Users can view their calls"
ON public.call_sessions
FOR SELECT
USING (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can create call sessions
CREATE POLICY "Users can create calls"
ON public.call_sessions
FOR INSERT
WITH CHECK (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Users can update their call sessions
CREATE POLICY "Users can update their calls"
ON public.call_sessions
FOR UPDATE
USING (
  caller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;