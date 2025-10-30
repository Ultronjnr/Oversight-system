# Invitation System Testing Guide

## Quick Test (5 minutes)

### Step 1: Test Sending an Invitation
1. Navigate to Super Admin Panel (`/admin`)
2. Go to "Invitations" tab
3. Fill in the form:
   - Email: `testuser@example.com`
   - Invitation Type: `Employee`
   - Department: `IT`
4. Click "Send Invitation"
5. You should see:
   - Toast notification: "Sending invitation..."
   - Invitation appears in "Manage Invitations" table
   - Status: "Pending"

**✅ Check**: Invitation saved to database (email is normalized to lowercase)

### Step 2: Verify Invitation in Database
1. Open Supabase dashboard
2. Go to SQL Editor
3. Run this query:
```sql
SELECT email, status, created_at 
FROM invitations 
WHERE email = 'testuser@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

**✅ Check**: Should show:
- email: `testuser@example.com` (lowercase)
- status: `pending`
- created_at: recent timestamp

### Step 3: Test Invitation Verification
1. Open browser console (F12)
2. Run this JavaScript:
```javascript
// Get the token from Super Admin
const invitationEmail = 'testuser@example.com';
const response = await fetch('/.netlify/functions/verify-invitation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token: 'get-from-db', 
    email: invitationEmail 
  })
});
console.log(await response.json());
```

**✅ Check**: Response should show invitation details with status "pending"

### Step 4: Test Signup Flow
1. Get the invitation token from database:
```sql
SELECT token FROM invitations 
WHERE email = 'testuser@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

2. Navigate to: `/invite?token={TOKEN}&email=testuser@example.com`

3. You should see:
   - Oversight logo
   - "Complete Setup" title
   - Email field (disabled, shows testuser@example.com)
   - Name field (empty, editable)
   - Password field
   - Confirm Password field
   - Invitation Details box showing role and expiry

**✅ Check**: All fields load correctly

### Step 5: Complete Signup
1. Fill in the form:
   - Full Name: `Test User`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`

2. Click "Complete Setup"

3. You should see:
   - Toast: "Account Created Successfully"
   - Redirected to Login page

**✅ Check**: No errors in console

### Step 6: Verify User Created
1. Run this query in Supabase:
```sql
SELECT email, status, profile_completed, name, role 
FROM users 
WHERE email = 'testuser@example.com';
```

**✅ Check**: Should show:
- email: `testuser@example.com`
- status: `active`
- profile_completed: `true`
- name: `Test User`
- role: `Employee`

### Step 7: Verify Invitation Status Updated
1. Run this query in Supabase:
```sql
SELECT email, status, updated_at 
FROM invitations 
WHERE email = 'testuser@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

**✅ Check**: Should show:
- status: `accepted`
- updated_at: very recent (within last minute)

### Step 8: Test Login
1. Navigate to `/login`
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPassword123!`
3. Click "Sign In"

**✅ Check**:
- Login completes in < 2 seconds
- Redirected to appropriate portal (Dashboard for Employee)
- Can see user information

### Step 9: Verify Super Admin Panel Shows Update
1. Go back to Super Admin Panel (`/admin`)
2. Refresh the page (Ctrl+R)
3. Go to "Invitations" tab

**✅ Check**: 
- Invitation shows status "Accepted" (not "Pending")
- Color badge is green

## Advanced Tests

### Test Case-Insensitive Email
1. Send invitation to: `TestUser@Example.COM`
2. Copy invitation link
3. Navigate to: `/invite?token=...&email=TestUser@Example.COM`

**✅ Check**: 
- Should still load invitation details
- Should create user with email lowercase in database

### Test Email Validation
1. Try navigating to: `/invite?token=invalid&email=notexist@example.com`

**✅ Check**: 
- Page loads with default role "Employee"
- Console shows fallback message

### Test Expired Invitation
1. In Supabase, update an invitation:
```sql
UPDATE invitations 
SET expires_at = now() - interval '1 day'
WHERE email = 'old@example.com';
```

2. Try to access the invite link for that email

**✅ Check**: 
- Verification fails
- Fallback message in console

### Test Multiple Invitations
1. Send invitation to same email twice (different dates)
2. Click both links

**✅ Check**: 
- Both invitations should be verifiable
- But only one should be marked "accepted" (the one you clicked)
- Resending the other link should still work until clicked

## Debugging Checklist

If something doesn't work, check these in order:

### 1. Email Not Received
- [ ] Check that `EMAIL_FROM` is set in Supabase Functions Settings
- [ ] Verify sender email is verified in Resend dashboard
- [ ] Check Resend logs for bounces
- [ ] Check spam folder
- [ ] Review send-invitation-email function logs

### 2. Verification Page Won't Load
- [ ] Check that token is correct (from database)
- [ ] Check that email is URL-encoded: `testuser@example.com` → `testuser%40example.com`
- [ ] Check browser console for error messages
- [ ] Verify RLS policy allows public access to invitations

### 3. Signup Won't Complete
- [ ] Check that password is at least 8 characters
- [ ] Check passwords match exactly
- [ ] Check that auth.users table isn't full
- [ ] Review browser console for error messages
- [ ] Check Supabase auth logs

### 4. Login Fails After Signup
- [ ] Verify user exists in public.users table
- [ ] Verify email matches exactly (case-insensitive)
- [ ] Check that auth.users has the same email
- [ ] Try logout and login again
- [ ] Clear browser cache (Ctrl+Shift+Delete)

### 5. Status Not Updating in Super Admin
- [ ] Refresh the page (Ctrl+R)
- [ ] Check that database trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_invitation_accepted';
```
- [ ] Manually check invitations table: `SELECT * FROM invitations WHERE email = 'test@example.com';`

## Manual Database Verification

Run these queries to verify everything is configured correctly:

```sql
-- 1. Check users table structure
\d users

-- 2. Check invitations table structure
\d invitations

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'invitations');

-- 4. Check all policies
SELECT policyname, tablename FROM pg_policies 
WHERE tablename IN ('users', 'invitations') 
ORDER BY tablename, policyname;

-- 5. Check triggers exist
SELECT tgname, tgrelname FROM pg_trigger 
WHERE tgrelname IN ('users', 'invitations') 
ORDER BY tgrelname, tgname;

-- 6. Check function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%invitation%';

-- 7. Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'invitations') 
ORDER BY indexname;
```

## Performance Expectations

### Normal Response Times:
- Invitation sending: < 1 second
- Email delivery: 5-30 seconds (async)
- Verification: < 1 second
- Signup: < 2 seconds
- Login: < 2 seconds

### If slower:
- Check that indexes are created
- Check Supabase performance metrics
- Review browser network tab for slow requests
- Check for RLS policy issues causing full table scans

## Success Criteria

Your invitation system is working perfectly when:

✅ Invitations are sent from Super Admin Panel
✅ Users receive invitation emails
✅ Users can click the link and see invitation details
✅ Users can complete signup
✅ Users are redirected to Login page
✅ Super Admin Panel shows invitation status as "Accepted"
✅ Users can log in with their credentials
✅ Login completes without delays (< 2 seconds)
✅ Users can access their appropriate portal
✅ All console warnings are resolved

Once all these pass, your invitation system is ready for production!
