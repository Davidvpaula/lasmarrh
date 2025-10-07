-- Add missing RLS policies for active_sessions table
-- This allows users to manage their own sessions while keeping tokens secure

-- Allow users to create their own sessions
CREATE POLICY "Users can create their own sessions"
ON public.active_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own sessions (e.g., update last_activity)
CREATE POLICY "Users can update their own sessions"
ON public.active_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own sessions (e.g., logout)
CREATE POLICY "Users can delete their own sessions"
ON public.active_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());