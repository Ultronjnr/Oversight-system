# Super Admin Setup - Complete Step-by-Step Guide

## Overview

This guide walks you through creating the super admin user with full oversight.global domain configuration.

---

## Super Admin Credentials

```
Email:    noreply@oversight.global
Password: SuperAdmin2025
Role:     SuperUser
```

---

## PART 1: Create Auth User (2 minutes)

### Step 1.1: Go to Supabase Authentication

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **mknamvkplhusntnarcmb**
3. Click **Authentication** in the left sidebar
4. Click **Users** tab

### Step 1.2: Create New User

1. Click **"Invite user"** button (or **Create new user**)
2. A form will appear with fields:
   - **Email**
   - **Password**
   - **Confirm Password**

3. Fill in:
   - **Email:** `noreply@oversight.global`
   - **Password:** `SuperAdmin2025`
   - **Confirm Password:** `SuperAdmin2025`

4. Click **"Create user"** or **"Send invite"**

✅ **Success:** User is now created in `auth.users` table

---

## PART 2: Set User Metadata (1 minute)

### Step 2.1: Add User Metadata

1. Still in **Authentication → Users**
2. Find the user: `noreply@oversight.global`
3. Click on the user email to open details
4. Scroll to **User metadata** section (if visible)
5. Click **"Edit metadata"** or similar button

### Step 2.2: Enter Metadata JSON

Paste this JSON into the metadata field:

```json
{
  "name": "Super Admin",
  "role": "SuperUser",
  "department": "System"
}
```

6. Click **Update user metadata** or **Save**

✅ **Success:** Auth user now has SuperUser role in metadata

---

## PART 3: Create User Profile (1 minute)

### Step 3.1: Go to SQL Editor

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **"New Query"** button

### Step 3.2: Run SQL Script

1. Open the file: `CREATE_SUPER_ADMIN.sql` (in your project root)
2. Copy the SQL code
3. Paste it into the SQL Editor
4. Click **"Run"** button (or press Cmd/Ctrl + Enter)

Expected output:
```
Query executed successfully

Result: 1 row affected
```

✅ **Success:** User profile created in `public.users` table

### Step 3.3: Verify

Run this verification query in the SQL Editor:

```sql
SELECT email, role, name, department, permissions 
FROM public.users 
WHERE email = 'noreply@oversight.global';
```

You should see:
```
email: noreply@oversight.global
role: SuperUser
name: Super Admin
department: System
permissions: [system:super, roles:manage, users:manage, audit:view-all, emails:send]
```

✅ **Perfect:** User profile is created correctly

---

## PART 4: Test Login (2 minutes)

### Step 4.1: Go to Login Page

1. Open your app (usually `http://localhost:4184` or your deployment URL)
2. Navigate to `/login`
3. You should see the login form

### Step 4.2: Login as Super Admin

1. **Email field:** `noreply@oversight.global`
2. **Password field:** `SuperAdmin2025`
3. Click **"Sign In"** button

### Step 4.3: Verify Access

After login, you should:
1. See the main dashboard
2. Be able to navigate to `/super-admin`
3. See the **Invitations** section with:
   - Send New Invitation form
   - Manage Invitations table

✅ **Success:** Super admin login working!

---

## PART 5: Test Email System (3 minutes)

### Step 5.1: Send Test Invitation

1. At `/super-admin`, click **Invitations** tab
2. Click **"Send New Invitation"** button
3. Fill in the form:
   - **Email Address:** `testuser@example.com` (use a REAL email you can check)
   - **Invitation Type:** `Employee`
   - **Department:** (optional)
   - **Message:** (optional)
4. Click **"Send Invitation"** button

### Step 5.2: Check Debug Panel

1. Look for the purple **"Email Debug"** button in the bottom-left corner
2. Click it to open the debug panel
3. You should see an entry showing:
   - Email: `testuser@example.com`
   - Role: `Employee`
   - Status: Should transition from 🟡 **Pending** → 🟢 **Sent**

✅ **Success:** Email sent successfully

### Step 5.3: Check Email Inbox

1. Go to the email account for `testuser@example.com`
2. Wait 30-60 seconds
3. Check **Inbox** for email from: `noreply@oversight.global`
4. Subject should be: **"Welcome to Oversight - Complete Your Account Setup"**
5. Email should contain an invitation link

✅ **Success:** Email received! System is working!

---

## VERIFICATION CHECKLIST

Complete these checks in order:

### Authentication Setup
- [ ] User created in Supabase Authentication
- [ ] Email: `noreply@oversight.global`
- [ ] Password: `SuperAdmin2025`
- [ ] User metadata includes role: `SuperUser`

### User Profile Setup
- [ ] User profile created in `public.users` table
- [ ] Role is `SuperUser` (exact spelling)
- [ ] Name is `Super Admin`
- [ ] Department is `System`
- [ ] Permissions array is populated

### Login & Access
- [ ] Can login with super admin credentials
- [ ] Redirected to dashboard after login
- [ ] Can navigate to `/super-admin`
- [ ] Can access Invitations section
- [ ] Super Admin Panel is visible and functional

### Email System
- [ ] Can send test invitation from `/super-admin`
- [ ] Debug panel shows "Sent" status (green)
- [ ] Test email received in inbox
- [ ] Email is from `noreply@oversight.global`
- [ ] Email subject is correct
- [ ] Email has invitation link

---

## Troubleshooting

### "User already exists" error in SQL

**Cause:** The user already exists in the database

**Solution:** 
- The SQL script uses `ON CONFLICT ... DO UPDATE`
- This is safe - it will just update the existing user
- Continue to the next step

---

### Can't login after creation

**Cause:** Password might be different, or user wasn't created properly

**Solution:**
1. Go to Supabase → Authentication → Users
2. Find `noreply@oversight.global`
3. Click to open details
4. Check if "Email confirmed" shows ✅
5. If not confirmed, click "Confirm email"
6. Try login again

---

### "Access Denied" at `/super-admin`

**Cause:** Role not set correctly to `SuperUser`

**Solution:**
1. Go to SQL Editor
2. Run:
```sql
SELECT email, role FROM public.users WHERE email = 'noreply@oversight.global';
```
3. Check that `role` column shows `SuperUser` (exact spelling, case-sensitive)
4. If not, the SQL script didn't run correctly - run it again

---

### Email not sending

**Cause:** Environment variables not set or Resend not configured

**Solution:**
1. Check Supabase Functions → Settings
2. Verify `EMAIL_FROM = noreply@oversight.global`
3. Verify `RESEND_API_KEY` is set (starts with `re_`)
4. Check Function logs for errors
5. Read `LOG_INTERPRETATION_GUIDE.md` for error messages

---

## Summary

| Step | Time | What You Do |
|------|------|------------|
| 1 | 2 min | Create auth user in Supabase Dashboard |
| 2 | 1 min | Add user metadata via Supabase UI |
| 3 | 1 min | Run SQL script to create user profile |
| 4 | 2 min | Test login with super admin credentials |
| 5 | 3 min | Send test invitation and verify |

**Total Time: ~10 minutes**

---

## Next Steps After Completion

Once super admin is created and verified:

1. **Send real invitations** to your users
2. **Users receive emails** with invitation links
3. **Users click link** and create their accounts
4. **Users login** to their portals based on role
5. **System is ready** for production!

---

## Support

If you get stuck at any step:

1. Check this guide again for the exact step
2. Read the troubleshooting section
3. Check Supabase logs (Functions → Logs tab)
4. Read `LOG_INTERPRETATION_GUIDE.md` for error messages

**You've got this!** 🚀
