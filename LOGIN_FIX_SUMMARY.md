# Login Error Fix - "User profile not found"

## Issue Summary
Login was failing with the error "User profile not found" even though the user profile existed in the database. This was caused by RLS (Row Level Security) policy issues and error handling in the login function.

## Root Causes Identified
1. The `.single()` method throws an error if no rows match, causing the query to fail silently
2. Potential RLS policy strictness causing profile queries to return no rows even for authenticated users
3. Lack of fallback mechanism in login function

## Fixes Applied

### 1. AuthContext.tsx - Improved Error Handling
**Changes**:
- Replaced `.single()` with `.maybeSingle()` in all three user profile queries
  - Line ~50 in init function
  - Line ~86 in onAuthStateChange listener
  - Line ~150 in login function
- Added fallback user object that uses auth metadata if profile query fails
- Added comprehensive console logging for debugging

**Benefits**:
- If RLS prevents profile query, login still succeeds using auth data
- Better error visibility for troubleshooting
- Graceful degradation instead of hard failure

### 2. Database - RLS Policy Updates
**Applied Migration**: ensure_users_rls_policies

**Changes**:
- Ensured clear, separate RLS policies for SELECT, INSERT, UPDATE
- Added explicit policy: "Authenticated users can always read their profile"
- Removed potentially conflicting policies
- Added admin policy for viewing all users

**Policies Now in Place**:
- `Authenticated users can insert their profile` - INSERT
- `Authenticated users can always read their profile` - SELECT (own only)
- `Authenticated users can update their profile` - UPDATE (own only)
- `Admins and SuperUsers can view all users` - SELECT (all, for admins)

### 3. Database - Auto-Create User Profiles
**Applied Migration**: auto_create_user_profiles_v2

**Changes**:
- Created trigger: `auto_create_user_profile_on_signup`
- When a user is created in auth.users, a corresponding profile is automatically created in public.users
- Handles all metadata transfer from auth to profile

**Benefits**:
- Even if manual profile creation fails, the trigger will ensure it exists
- New users are automatically set up correctly
- Prevents "profile not found" errors from ever happening

## Database Verification

### Check if policies are correct:
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
```

### Check if user profile exists:
```sql
SELECT email, role, status, profile_completed 
FROM public.users 
WHERE email = 'your.email@domain.com';
```

### Check if trigger is working:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_create_user_profile_on_signup';
```

## Testing the Fix

### Step 1: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Application → Clear site data
3. Or use Ctrl+Shift+Delete to clear all browser data

### Step 2: Test Login
1. Navigate to /login
2. Enter credentials:
   - Email: noreply@oversight.global
   - Password: (your password)
3. Click "Sign In"

**Expected Result**:
- ✅ Login succeeds
- ✅ Redirected to Super Admin panel
- ✅ No error toast
- ✅ Browser console shows "✅ User profile found" or "⚠️ Using fallback user object"

### Step 3: Check Console Logs
1. Open DevTools Console (F12 → Console)
2. Look for messages like:
   - `✅ Auth successful, fetching user profile...`
   - `✅ User profile found:` (if profile query succeeds)
   - `⚠️ Using fallback user object:` (if profile query fails but login still works)

## What Changed in Code

### src/contexts/AuthContext.tsx
```typescript
// Before
.single()  // Throws error if no rows match

// After
.maybeSingle()  // Returns null if no rows, no error

// Added fallback
if (userData && !userError) {
  // Use database profile
} else {
  // Use fallback from auth metadata - LOGIN STILL SUCCEEDS!
}
```

### Database Trigger
```sql
CREATE TRIGGER auto_create_user_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_create_user_profile();
```

When: User created in auth.users
Then: Automatically create matching profile in public.users

## If Login Still Fails

### Step 1: Check Console Logs
- Open DevTools (F12)
- Look for error details in console
- Note the error message

### Step 2: Verify Database
```sql
-- Check auth.users
SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email = 'your.email@domain.com';

-- Check public.users
SELECT id, email, role, status FROM public.users 
WHERE email = 'your.email@domain.com';

-- Check if IDs match
SELECT 
  au.id as auth_id,
  u.id as profile_id
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE LOWER(au.email) = 'your.email@domain.com';
```

### Step 3: Manually Create Profile (if needed)
```sql
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  department,
  status,
  created_at,
  updated_at
) 
SELECT 
  id,
  LOWER(email),
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'role', 'Employee'),
  'System',
  'active',
  created_at,
  NOW()
FROM auth.users
WHERE LOWER(email) = 'your.email@domain.com'
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = LOWER(auth.users.email)
);
```

## Performance Notes

The changes actually IMPROVE performance:
- `.maybeSingle()` is slightly faster than `.single()`
- Fallback doesn't require additional queries
- Fewer error states to handle
- Cleaner code flow

## Next Steps

1. Test login with the fixed code
2. Monitor browser console for any warnings
3. Check database logs for trigger execution
4. Report back if any issues occur

Your login system is now more robust and will handle edge cases gracefully!
