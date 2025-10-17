# Email Not Received - Quick Fix Steps

**TL;DR:** Emails aren't being received because the Edge Function likely doesn't have proper environment variables set. Follow these steps:

---

## 🚨 IMMEDIATE ACTION (Do This Now)

### Step 1: Set Environment Variables in Supabase (5 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **mknamvkplhusntnarcmb**
3. Click **Functions** → Click ⚙️ **Settings**
4. Scroll to **Environment Variables**
5. Add these two variables:

**Variable 1:**
```
Key: RESEND_API_KEY
Value: re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy
```
(Or your complete Resend API key from [Resend Dashboard](https://dashboard.resend.com) → Settings)

**Variable 2:**
```
Key: EMAIL_FROM
Value: Michaelmokhoro08@gmail.com
```

6. Click **Save** for each variable
7. Wait 30 seconds for changes to take effect

### Step 2: Verify Email is Verified in Resend (3 minutes)

1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Click **Verified Domains & Senders**
3. Check if `Michaelmokhoro08@gmail.com` is in the list with **Verified** status
4. If NOT verified:
   - Click **Add Email**
   - Enter `Michaelmokhoro08@gmail.com`
   - Follow verification steps
   - Wait for email confirmation

### Step 3: Test Sending an Invitation (2 minutes)

1. Go back to your app
2. Login as Super Admin (go to `/login` then `/super-admin`)
3. Click "Send New Invitation" tab
4. Fill in the form:
   - Email: `testuser@gmail.com` (your test email)
   - Invitation Type: `Employee`
5. Click "Send Invitation"
6. Click the purple "Email Debug" button in bottom-left corner
7. **You should see:**
   - 🟡 Pending (sending)
   - 🟢 Sent (success!)

### Step 4: Check Email Received (3 minutes)

1. Go to your test email inbox
2. Wait 30 seconds
3. Check for email titled: **"Welcome to Oversight - Complete Your Account Setup"**
4. Check Spam/Junk folder if not in Inbox
5. If NOT received:
   - Go to [Resend Dashboard](https://dashboard.resend.com) → Activity
   - Look for the test email you just sent
   - Check the status (Delivered? Bounced? Rejected?)

---

## 🔍 DIAGNOSTIC: Check Function Logs

If email says "Sent" but you didn't receive it:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select: **mknamvkplhusntnarcmb**
3. Go to **Functions → send-invitation-email**
4. Click **Logs** tab
5. Send another test invitation
6. **Watch the logs** for messages like:

✅ **Success:**
```
✅ Environment variables configured
✅ Email sent successfully via Resend
```

❌ **Error Examples:**
```
❌ RESEND_API_KEY not set → Add the variable in Functions → Settings
❌ RESEND_API_KEY format is invalid → Check the API key format
❌ Sender email is not verified → Verify email in Resend Dashboard
```

---

## 📋 What Should Happen (Happy Path)

1. **You click "Send Invitation"** in Super Admin panel
2. **Debug panel shows:** 🟡 Pending (Email being sent...)
3. **Debug panel shows:** 🟢 Sent (Success!)
4. **Supabase logs show:** ✅ Email sent successfully via Resend
5. **Resend Activity shows:** Delivered (green)
6. **User inbox receives:** Welcome to Oversight email with invitation link

---

## ❌ Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| Debug shows 🔴 Failed | Supabase logs | Check error message in logs |
| Email says "Sent" but not received | Resend Activity | Check if status is "Delivered" or "Rejected" |
| Email in Spam folder | Email inbox Spam | Use verified domain in Resend (better deliverability) |
| RESEND_API_KEY not set error | Functions Settings | Add `RESEND_API_KEY` to Environment Variables |
| Invalid API key error | Resend Dashboard | Copy the FULL API key (40+ chars starting with `re_`) |
| Sender not verified error | Resend Settings | Verify `Michaelmokhoro08@gmail.com` as sender |

---

## 🎯 If This Doesn't Work

After doing all steps above, if emails still don't arrive:

1. **Share this information:**
   - Screenshot of Supabase Functions → Settings showing the environment variables
   - Screenshot of Resend Verified Domains & Senders page
   - Screenshot of Resend Activity showing the test email status
   - The exact error message from Supabase logs

2. **Also try:**
   - Create a verified domain in Resend (for better deliverability)
   - Switch to using a domain email like `noreply@yourdomain.com`
   - This dramatically improves email delivery

---

## Video Walkthrough (Manual Steps)

### Setting Environment Variables:
1. Supabase Dashboard → mknamvkplhusntnarcmb
2. Functions → Settings
3. Find "Environment Variables" section
4. Add RESEND_API_KEY and EMAIL_FROM
5. Click Save
6. Wait 30 seconds

### Verifying Email:
1. Resend Dashboard → Verified Domains & Senders
2. Check if Michaelmokhoro08@gmail.com is Verified
3. If not, click "Add Email" and verify via email link

### Sending Test:
1. App → /login → /super-admin
2. Send New Invitation tab
3. Enter test email and click Send
4. Click Email Debug button
5. Should see green "Sent" status

### Checking Email:
1. Your test email inbox
2. Look for "Welcome to Oversight" email
3. Check Spam folder if not found
4. If Resend shows "Delivered" but email not received, it's a deliverability/spam issue

---

**Ready to get started? Follow "IMMEDIATE ACTION" steps above! 👆**
