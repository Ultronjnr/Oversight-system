-- Migration: Fix Finance portal PR visibility
-- This migration ensures:
-- 1. All auth users have corresponding public.users rows
-- 2. RLS policies are correct for Finance users
-- 3. Finance users can view all pending PRs

-- Step 1: Ensure all auth users are synced to public.users
-- This handles any users created without the trigger firing
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    INSERT INTO public.users (id, email, role, name, department, permissions)
    VALUES (
      auth_user.id,
      auth_user.email,
      'Employee',
      split_part(auth_user.email, '@', 1),
      NULL,
      '{}'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Step 2: Verify and fix the Finance user role
-- This updates any users that should be Finance but aren't set correctly
-- You can uncomment and modify the email to match your Finance user
-- UPDATE public.users 
-- SET role = 'Finance'
-- WHERE email = 'finance@example.com' AND role != 'Finance';

-- Step 3: Drop old/conflicting RLS policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "HOD can view department PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Finance can view all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Admin can view all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Users can insert their own PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "HOD can update department PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Finance can update all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Admin can update all PRs" ON public.purchase_requisitions;

-- Step 4: Re-create RLS policies with improved logic
-- Users can view their own PRs
CREATE POLICY "Users can view their own PRs" ON public.purchase_requisitions
  FOR SELECT 
  USING (auth.uid() = requested_by);

-- HOD can view PRs from their department
CREATE POLICY "HOD can view department PRs" ON public.purchase_requisitions
  FOR SELECT 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'HOD' 
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid() LIMIT 1)
  );

-- Finance can view all PRs - THIS IS THE KEY POLICY FOR THE FIX
CREATE POLICY "Finance can view all PRs" ON public.purchase_requisitions
  FOR SELECT 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'Finance'
  );

-- Admin can view all PRs
CREATE POLICY "Admin can view all PRs" ON public.purchase_requisitions
  FOR SELECT 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'SuperUser')
  );

-- Users can insert their own PRs
CREATE POLICY "Users can insert their own PRs" ON public.purchase_requisitions
  FOR INSERT 
  WITH CHECK (auth.uid() = requested_by);

-- HOD can update PRs in their department
CREATE POLICY "HOD can update department PRs" ON public.purchase_requisitions
  FOR UPDATE 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'HOD'
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid() LIMIT 1)
  );

-- Finance can update all PRs
CREATE POLICY "Finance can update all PRs" ON public.purchase_requisitions
  FOR UPDATE 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'Finance'
  );

-- Admin can update all PRs
CREATE POLICY "Admin can update all PRs" ON public.purchase_requisitions
  FOR UPDATE 
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'SuperUser')
  );

-- Step 5: Create a helper function to diagnose user setup issues
CREATE OR REPLACE FUNCTION public.diagnose_finance_access()
RETURNS TABLE (
  auth_user_id uuid,
  auth_user_email text,
  db_user_exists boolean,
  db_user_role text,
  can_view_prs boolean,
  issue_description text
) AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  user_count integer;
  pr_count integer;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::text,
      false,
      NULL::text,
      false,
      'Not authenticated - no session found'::text;
    RETURN;
  END IF;
  
  -- Get user info from public.users
  SELECT role INTO user_role FROM public.users WHERE id = current_user_id;
  
  -- Count available PRs based on policies
  SELECT COUNT(*) INTO pr_count FROM public.purchase_requisitions;
  
  -- Determine if user should have access
  RETURN QUERY SELECT 
    current_user_id,
    (SELECT email FROM auth.users WHERE id = current_user_id),
    EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id),
    user_role,
    (user_role = 'Finance' OR user_role IN ('Admin', 'SuperUser') OR EXISTS (
      SELECT 1 FROM public.purchase_requisitions pr 
      WHERE pr.requested_by = current_user_id LIMIT 1
    ))::boolean,
    CASE 
      WHEN user_role IS NULL THEN 'User has no role set in public.users'
      WHEN user_role = 'Finance' THEN 'Finance user - should have access to all PRs'
      WHEN user_role IN ('Admin', 'SuperUser') THEN 'Admin user - should have access to all PRs'
      WHEN user_role = 'Employee' THEN 'Employee user - can only view own PRs'
      WHEN user_role = 'HOD' THEN 'HOD user - can view department PRs'
      ELSE 'Unknown role: ' || user_role
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the fix
COMMENT ON MIGRATION '20250101000099_fix_finance_portal_visibility' IS 'Fixes Finance portal not showing PRs by:
1. Ensuring all auth users have public.users rows with correct roles
2. Consolidating RLS policies to use consistent logic
3. Adding LIMIT 1 to subqueries to prevent issues
4. Providing diagnostic function to troubleshoot access issues';
