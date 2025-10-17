# ⚡ Quick Start - Super Admin Setup (10 minutes)

## Ready to Go! Follow These Steps

### 📋 Your Credentials
```
Email:    noreply@oversight.global
Password: SuperAdmin2025
Role:     SuperUser
```

---

## STEP 1️⃣: Create Auth User (2 min)

**Go to:** [Supabase Dashboard](https://app.supabase.com/project/mknamvkplhusntnarcmb)

1. Click **Authentication** → **Users**
2. Click **"Invite user"** button
3. Enter:
   - Email: `noreply@oversight.global`
   - Password: `SuperAdmin2025`
   - Confirm: `SuperAdmin2025`
4. Click **Create user**

✅ **Done!** User created in auth.users

---

## STEP 2️⃣: Add Metadata (1 min)

1. Still in **Users** list, click on the user `noreply@oversight.global`
2. Scroll to **User metadata**
3. Click **Edit** or paste this JSON:

```json
{
  "name": "Super Admin",
  "role": "SuperUser",
  "department": "System"
}
```

4. Click **Save**

✅ **Done!** Metadata set

---

## STEP 3️⃣: Create Profile Record (1 min)

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy & paste the SQL from: `CREATE_SUPER_ADMIN.sql` (in your project root)
4. Click **Run**

Expected: `1 row affected`

✅ **Done!** User profile created

---

## STEP 4️⃣: Test Login (2 min)

1. Open your app: `http://localhost:4184` (or your URL)
2. Go to `/login`
3. Enter:
   - Email: `noreply@oversight.global`
   - Password: `SuperAdmin2025`
4. Click **Sign In**

✅ **Done!** You're logged in as Super Admin

---

## STEP 5️⃣: Test Invitations (2 min)

1. Navigate to `/super-admin`
2. Click **Invitations** tab
3. Click **Send New Invitation**
4. Fill in:
   - Email: `testuser@example.com` (your test email)
   - Invitation Type: `Employee`
5. Click **Send Invitation**
6. Check purple **Email Debug** button → should show 🟢 **Sent**
7. Check your test email inbox for invitation

✅ **Done!** Email system working!

---

## 🎉 You're All Set!

Your Oversight system is now:
- ✅ Ready with super admin user
- ✅ Configured with oversight.global domain
- ✅ Sending real invitations via email
- ✅ Ready for production use

---

## Need Help?

- **Step-by-step guide:** Read `SUPER_ADMIN_SETUP_INSTRUCTIONS.md`
- **SQL script:** See `CREATE_SUPER_ADMIN.sql`
- **Email issues:** Read `LOG_INTERPRETATION_GUIDE.md`
- **Domain info:** See `DOMAIN_UPDATE_COMPLETE.md`

---

## What Happens Next?

1. Super admin can send invitations to real users
2. Users receive emails with invitation links
3. Users create accounts and login
4. Users see portals based on their role (Employee, HOD, Finance, Admin)
5. **System is live and operational!** 🚀

**Go ahead and start with Step 1 above!** ⬆️
