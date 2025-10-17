# Supabase Edge Function Deployment Guide

## Overview

The `send-invitation-email` Edge Function is responsible for sending invitation emails to users. It's a serverless function that runs on Supabase's infrastructure and integrates with Resend for email delivery.

---

## STEP 1: Ensure Edge Function Code is in Place

The function code should be located at:
```
supabase/functions/send-invitation-email/index.ts
```

Verify the file exists and contains the enhanced diagnostic code with detailed logging.

---

## STEP 2: Deploy the Edge Function to Supabase

### Option A: Using Supabase CLI (Recommended for Local Development)

If you have the Supabase CLI installed:

```bash
# Login to Supabase (if not already logged in)
supabase login

# Deploy the function
supabase functions deploy send-invitation-email --project-id mknamvkplhusntnarcmb
```

### Option B: Using Supabase Dashboard (Web UI)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **mknamvkplhusntnarcmb**
3. Navigate to **Functions** in the left sidebar
4. Look for `send-invitation-email`
5. If it exists, click to open it and verify the code is up to date
6. If it doesn't exist:
   - Click **Create a new function**
   - Name it: `send-invitation-email`
   - Paste the contents of `supabase/functions/send-invitation-email/index.ts`
   - Click **Save & Deploy**

---

## STEP 3: Configure Environment Variables

This is **critical** for the function to work.

### In Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **mknamvkplhusntnarcmb**
3. Navigate to **Functions → Settings** (or click the ⚙️ icon)
4. Scroll to **Environment Variables** section
5. Add/Update the following variables:

#### Variable 1: RESEND_API_KEY
- **Key:** `RESEND_API_KEY`
- **Value:** Your complete Resend API key (from [Resend Dashboard](https://dashboard.resend.com) → Settings → API Keys)
  - Should start with `re_` and be 40+ characters
  - Example: `re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy`
- Click **Save**

#### Variable 2: EMAIL_FROM
- **Key:** `EMAIL_FROM`
- **Value:** Your verified sender email
  - Use the email you verified in Resend
  - Example: `Michaelmokhoro08@gmail.com`
- Click **Save**

#### Variable 3 (Optional): SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
These should already be available to the function automatically, but if needed:
- **Key:** `SUPABASE_URL`
- **Value:** `https://mknamvkplhusntnarcmb.supabase.co`

And:
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Your Supabase service role key (from Project Settings → API)

---

## STEP 4: Verify Function Deployment

### Check Function Status:
1. Go to **Functions** in Supabase Dashboard
2. Click on `send-invitation-email`
3. You should see:
   - ✅ Status: **Active** (green indicator)
   - Function URL displayed

### Test the Function (Optional):
1. Click the **Execute** button on the function page
2. Use this test payload:
```json
{
  "email": "test@gmail.com",
  "role": "Employee",
  "department": "IT",
  "inviterEmail": "admin@oversight.local",
  "inviteLink": "https://yourdomain.com/invite?token=test123&email=test@gmail.com"
}
```
3. Click **Send**
4. Check the response and **Logs** tab for diagnostics

---

## STEP 5: Monitor Function Logs

The enhanced function includes detailed logging that will help diagnose issues.

### View Logs in Supabase Dashboard:
1. Go to **Functions → send-invitation-email**
2. Click the **Logs** tab
3. Send a test invitation from the Super Admin panel
4. **Watch the logs in real-time** (refresh if needed)
5. Look for these success indicators:
   - ✅ `Environment variables configured`
   - ✅ `Email sent successfully via Resend`
   - ✅ `SUCCESS: Email sent via Resend`

### Interpret Common Log Messages:

#### Success (✅)
```
✅ Environment variables configured
📧 Attempting to send email via Resend: { to: "...", from: "...", subject: "..." }
✅ Email sent successfully via Resend: { messageId: "...", timestamp: "..." }
✅ SUCCESS: Email sent via Resend
```

#### API Key Not Set (❌)
```
❌ RESEND_API_KEY environment variable is not set
```
**Action:** Add `RESEND_API_KEY` to Environment Variables (STEP 3)

#### Invalid API Key (❌)
```
❌ RESEND_API_KEY format is invalid
hint: API key should start with "re_" and be at least 40+ characters
```
**Action:** Verify your API key in Resend Dashboard and update in Supabase

#### Sender Not Verified (❌)
```
Sender email is not verified in Resend.
Go to Resend Dashboard → Verified Domains & Senders to verify
```
**Action:** Verify the sender email in Resend Dashboard

---

## STEP 6: Test End-to-End

### Full Testing Flow:
1. **Login as Super Admin**
   - Go to `/login`
   - Email: Your email (with SuperUser role in `public.users`)
   - Navigate to `/super-admin`

2. **Send Test Invitation**
   - Click "Send New Invitation" tab
   - Fill in the form:
     - Email: `yourtestmail@gmail.com` (change to a real test email)
     - Invitation Type: `Employee`
     - Department: (optional)
     - Message: (optional)
   - Click "Send Invitation"

3. **Check Debug Panel**
   - Look for the purple "Email Debug" button in the bottom-left
   - Click it to see real-time email sending status
   - Should see:
     - 🟡 Pending (sending...)
     - 🟢 Sent (success!)
     - Or 🔴 Failed (with error message)

4. **Check Function Logs**
   - Go to Supabase Dashboard → Functions → send-invitation-email → Logs
   - Look for success or error messages
   - This provides detailed diagnostics

5. **Check Resend Activity**
   - Go to [Resend Dashboard](https://dashboard.resend.com)
   - Click **Activity** or **Emails**
   - Look for the test email
   - Status should be **Delivered** (green)

6. **Check Email Inbox**
   - Wait 30-60 seconds
   - Check your test email inbox
   - Check Spam/Junk folder if not in Inbox
   - You should receive: "Welcome to Oversight - Complete Your Account Setup"

---

## Troubleshooting

### Email Shows "Sent" in Debug but Not Received

**Possible Causes:**
1. Email is in Spam/Junk folder
2. Sender email not verified in Resend
3. Email provider blocking the message

**Solutions:**
1. Check Spam, Promotions, and other folders
2. Check Resend Dashboard → Activity to confirm "Delivered" status
3. Create a verified domain in Resend (not just an email)
   - Go to Resend Dashboard → Domains
   - Add your domain
   - Verify DNS records
   - Use email like `noreply@yourdomain.com`

### Function Logs Show "RESEND_API_KEY not set"

**Cause:** Environment variable not configured

**Solution:**
1. Go to Supabase Functions → Settings
2. Add `RESEND_API_KEY` with your full Resend API key
3. Click **Save**
4. Wait 30 seconds
5. Try sending another test invitation

### Function Logs Show "API key is invalid"

**Cause:** The API key format is wrong or incomplete

**Solutions:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to Settings → API Keys
3. Copy the **full** API key (should start with `re_`)
4. Count characters to ensure it's complete (40+ chars)
5. Update in Supabase Functions → Settings
6. Try again

### Resend Shows "Rejected" Status

**Cause:** Sender email not verified or domain issue

**Solutions:**
1. Go to Resend Dashboard → Verified Domains & Senders
2. Verify that your sender email is in the list and marked **Verified**
3. If not, click **Add Email** and follow verification steps
4. Or create a verified domain instead (better deliverability)

---

## Environment Variables Reference

| Variable | Required | Value | Where to Get |
|----------|----------|-------|--------------|
| `RESEND_API_KEY` | Yes | API key starting with `re_` | [Resend Dashboard](https://dashboard.resend.com) → Settings → API Keys |
| `EMAIL_FROM` | Yes | Verified email address | Your verified sender email in Resend |
| `SUPABASE_URL` | Auto | `https://mknamvkplhusntnarcmb.supabase.co` | Auto-available to functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto | Your service role key | Auto-available to functions |

---

## Summary Checklist

- [ ] `supabase/functions/send-invitation-email/index.ts` file exists with latest code
- [ ] Function deployed to Supabase (visible in Functions dashboard)
- [ ] `RESEND_API_KEY` set in Functions → Settings
- [ ] `EMAIL_FROM` set in Functions → Settings
- [ ] Sender email verified in Resend Dashboard
- [ ] Test invitation sent and logs checked
- [ ] Email received in test inbox (or Spam)
- [ ] Resend Activity shows "Delivered" status

---

## Getting Help

If emails still aren't being received after completing all steps:

1. **Check Supabase Logs** for the exact error message
2. **Check Resend Activity** for delivery status
3. **Check Email Spam/Junk** folders
4. **Verify Resend sender email** is marked as Verified
5. Contact Resend Support: https://resend.com/support
