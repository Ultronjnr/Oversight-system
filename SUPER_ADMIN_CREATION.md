# Creating Super Admin User with oversight.global Domain

## Super Admin Credentials

- **Email:** `noreply@oversight.global`
- **Password:** `SuperAdmin2025`
- **Role:** `SuperUser`
- **Domain:** `oversight.global`

---

## Step 1: Create Super Admin in Supabase Auth

You have two options:

### Option A: Using Supabase Dashboard (Recommended for First-time Setup)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **mknamvkplhusntnarcmb**
3. Go to **Authentication** → **Users**
4. Click **"Invite user"** or **"Create new user"**
5. Fill in:
   - **Email:** `noreply@oversight.global`
   - **Password:** `SuperAdmin2025`
   - Click **Send invite** or **Create user**
6. The user will be created in `auth.users` table

### Option B: Using CLI or API

If you have Supabase CLI installed:

```bash
supabase auth admin create-user \
  --email noreply@oversight.global \
  --password SuperAdmin2025 \
  --project-id mknamvkplhusntnarcmb
```

---

## Step 2: Set User Metadata (Super Admin Role)

After creating the auth user, you need to set their metadata to make them a SuperUser.

### Via Supabase Dashboard:

1. In **Authentication** → **Users**, find the user with email `noreply@oversight.global`
2. Click on the user to open details
3. Scroll to **User metadata** section
4. Add JSON:
```json
{
  "name": "Super Admin",
  "role": "SuperUser",
  "department": "System"
}
```
5. Click **Update user metadata**

---

## Step 3: Verify User Profile in public.users Table

The user should be automatically created in the `public.users` table via a trigger.

To verify:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query:
```sql
select id, email, role, name, department, created_at 
from public.users 
where email = 'noreply@oversight.global';
```

You should see:
- `email`: `noreply@oversight.global`
- `role`: `SuperUser`
- `name`: `Super Admin`
- `department`: `System`

---

## Step 4: Test Login

1. Open your app and go to `/login`
2. Enter:
   - **Email:** `noreply@oversight.global`
   - **Password:** `SuperAdmin2025`
3. Click **Sign In**
4. You should be logged in and redirected to the dashboard
5. Navigate to `/super-admin` to access the Super Admin Panel

---

## Step 5: Configure EMAIL_FROM for Invitations

The super admin can now send invitations. The emails will be sent from:

**`noreply@oversight.global`**

This was already set in the environment variables (see ACTION_PLAN_EMAIL.md).

To verify it's set:

1. Go to **Functions → Settings** in Supabase
2. Check **Environment Variables**:
   - `EMAIL_FROM` should be `noreply@oversight.global`
   - `RESEND_API_KEY` should be your Resend API key

---

## Step 6: Send Your First Invitation

Now that Super Admin is created and configured:

1. Log in as **noreply@oversight.global** at `/login`
2. Go to `/super-admin`
3. Click **Invitations** tab
4. Click **Send New Invitation**
5. Fill in:
   - **Email:** `test@company.com` (a real test email)
   - **Invitation Type:** `Employee`
   - **Department:** (optional)
6. Click **Send Invitation**
7. Check the **Email Debug** panel (bottom-left) to see status
8. Check your test email inbox for the invitation

---

## Verification Checklist

- [ ] Super admin user created in `auth.users` table
- [ ] User metadata set with `role: "SuperUser"`
- [ ] User appears in `public.users` table with `role: "SuperUser"`
- [ ] Can login at `/login` with email and password
- [ ] Can access `/super-admin` page
- [ ] `EMAIL_FROM` environment variable set to `noreply@oversight.global`
- [ ] Can send test invitation
- [ ] Test email received in inbox

---

## Troubleshooting

### "User already exists" error
The email `noreply@oversight.global` might already exist. Either:
- Delete the existing user and create new one, OR
- Use a different super admin email if needed

### Can't login after creation
- Verify the password is correct: `SuperAdmin2025`
- Check that user metadata was set with `role: "SuperUser"`
- Check `public.users` table to verify the user profile exists

### Emails not sending
- Check `EMAIL_FROM` is set to `noreply@oversight.global` in Functions → Settings
- Check Supabase Edge Function logs
- Read `LOG_INTERPRETATION_GUIDE.md` for error messages

### "Access Denied" at /super-admin
- Verify user role is exactly `"SuperUser"` (case-sensitive)
- Check `public.users` table for the user's role
- Verify authentication is working (check browser console)

---

## Next Steps

Once super admin is created and verified:

1. Send invitations to real users
2. Users will receive emails with invitation links
3. Users click link and create their own accounts
4. Users can login and access their portals based on their role

**Your Oversight system is now ready for production!** 🚀
