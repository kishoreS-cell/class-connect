-- Create a function to generate notification for reminder one day before
CREATE OR REPLACE FUNCTION public.create_reminder_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert notification for one day before the reminder
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Reminder Tomorrow: ' || NEW.title,
    COALESCE(NEW.description, 'You have a reminder scheduled for tomorrow.'),
    'reminder',
    '/calendar'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to call function when reminder is inserted
CREATE TRIGGER on_reminder_created
  AFTER INSERT ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_reminder_notification();