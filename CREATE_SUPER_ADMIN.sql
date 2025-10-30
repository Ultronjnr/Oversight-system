-- ============================================================================
-- CREATE SUPER ADMIN USER - Run this in Supabase SQL Editor
-- ============================================================================
-- This script creates the super admin user with all necessary metadata and roles
-- 
-- Super Admin Details:
-- - Email: noreply@oversight.global
-- - Password: SuperAdmin2025
-- - Role: SuperUser
-- - Department: System
-- ============================================================================

-- Step 1: Create the auth user with admin API
-- NOTE: You must run this in Supabase Dashboard → Authentication → Users
-- OR use the following method in SQL Editor if you have service role access

-- First, ensure the user exists in public.users table
-- (The auth.users row will be created via the Supabase UI)

-- Step 2: Insert or update the user profile in public.users table
-- This will create the complete user record with all metadata
INSERT INTO public.users (
  email,
  role,
  name,
  department,
  permissions,
  created_at,
  updated_at
)
VALUES (
  'noreply@oversight.global',
  'SuperUser',
  'Super Admin',
  'System',
  ARRAY['system:super', 'roles:manage', 'users:manage', 'audit:view-all', 'emails:send'],
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SuperUser',
  name = 'Super Admin',
  department = 'System',
  permissions = ARRAY['system:super', 'roles:manage', 'users:manage', 'audit:view-all', 'emails:send'],
  updated_at = NOW();

-- Step 3: Verify the user was created
SELECT 
  email,
  role,
  name,
  department,
  permissions,
  created_at
FROM public.users
WHERE email = 'noreply@oversight.global';

-- ============================================================================
-- IMPORTANT: Before running this script:
-- ============================================================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Invite user" or "Create new user"
-- 3. Enter:
--    - Email: noreply@oversight.global
--    - Password: SuperAdmin2025
--    - Confirm Password: SuperAdmin2025
-- 4. Click "Create user"
-- 5. THEN run this SQL script in the SQL Editor
--
-- This script will:
-- - Create the user profile in public.users table
-- - Set role to SuperUser
-- - Add all necessary permissions
-- - Set department to System
-- ============================================================================

-- Additional: If you need to update the auth metadata manually:
-- Go to Supabase Dashboard → Authentication → Users → Select user → Update metadata
-- Add JSON:
-- {
--   "name": "Super Admin",
--   "role": "SuperUser",
--   "department": "System"
-- }
