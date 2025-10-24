-- Create a table to track online users waiting for a match
CREATE TABLE IF NOT EXISTS public.waiting_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  socket_id TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  country TEXT,
  is_matched BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.waiting_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their socket ID (no auth needed for anonymous chat)
CREATE POLICY "Anyone can join waiting queue"
ON public.waiting_users
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read waiting users (needed for matching)
CREATE POLICY "Anyone can view waiting users"
ON public.waiting_users
FOR SELECT
USING (true);

-- Allow users to update their own match status
CREATE POLICY "Anyone can update waiting users"
ON public.waiting_users
FOR UPDATE
USING (true);

-- Allow users to delete their socket ID when they disconnect
CREATE POLICY "Anyone can delete waiting users"
ON public.waiting_users
FOR DELETE
USING (true);

-- Enable realtime for the waiting_users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_users;

-- Auto-delete users who have been waiting for more than 5 minutes (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_waiting_users()
RETURNS void AS $$
BEGIN
  DELETE FROM public.waiting_users
  WHERE joined_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;