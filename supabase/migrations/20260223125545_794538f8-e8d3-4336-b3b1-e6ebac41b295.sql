
-- Fix INSERT policy to only allow inserting notifications for yourself
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
