-- Add profile_completed column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Create function to cleanup expired/unconfirmed invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  -- Delete expired invitations
  DELETE FROM public.invitations
  WHERE status = 'pending' AND expires_at < now();
  
  -- Delete cancelled invitations older than 30 days
  DELETE FROM public.invitations
  WHERE status = 'cancelled' AND updated_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually clean unconfirmed invitations
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_invitations(days_old integer DEFAULT 7)
RETURNS TABLE(deleted_count integer) AS $$
DECLARE
  count_deleted integer;
BEGIN
  DELETE FROM public.invitations
  WHERE status = 'pending' 
    AND created_at < now() - make_interval(days => days_old)
    AND expires_at < now();
  
  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  RETURN QUERY SELECT count_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on profile_completed for faster queries
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON public.users(profile_completed) WHERE profile_completed = false;
