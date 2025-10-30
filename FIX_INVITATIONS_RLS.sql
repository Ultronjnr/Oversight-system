-- Fix Invitations RLS Policy
-- Run this in Supabase SQL Editor to allow public access to pending invitations

-- Step 1: Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS invitations_select_public ON public.invitations;
DROP POLICY IF EXISTS invitations_select_auth ON public.invitations;
DROP POLICY IF EXISTS invitations_insert_auth ON public.invitations;
DROP POLICY IF EXISTS invitations_update_auth ON public.invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON public.invitations;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.invitations;

-- Step 3: Create policy for PUBLIC access to PENDING invitations (allows unauthenticated users)
CREATE POLICY invitations_select_public ON public.invitations
FOR SELECT
USING (status = 'pending' AND expires_at > now());

-- Step 4: Create policy for authenticated users to INSERT invitations
CREATE POLICY invitations_insert_auth ON public.invitations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Create policy for authenticated users to UPDATE invitations
CREATE POLICY invitations_update_auth ON public.invitations
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verify policies are in place
SELECT 
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'invitations'
ORDER BY policyname;
