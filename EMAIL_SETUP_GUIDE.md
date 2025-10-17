# Email Configuration & Testing Guide

## 🚀 Step 1: Redeploy the Updated Edge Function

The Edge Function has been enhanced with better debugging and error handling. You need to redeploy it.

### Option A: Deploy via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Click **Edge Functions** in the left sidebar
   - Find **send-invitation-email** function
   - Click on it

2. **Update the Code**
   - Copy the entire content from `supabase/functions/send-invitation-email/index.ts` in your project
   - Paste it into the Supabase editor
   - Click **Deploy**

3. **Wait for deployment to complete**
   - You should see "Deployment successful" message

### Option B: Deploy via Supabase CLI (If installed)

```bash
supabase functions deploy send-invitation-email
```

---

## ✅ Step 2: Verify Environment Variables in Supabase

1. **Go to Supabase Dashboard**
2. **Navigate to Edge Functions → Settings**
3. **Verify these environment variables are set:**
   ```
   RESEND_API_KEY=re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy
   EMAIL_FROM=Michaelmokhoro08@gmail.com
   SUPABASE_URL=https://mknamvkplhusntnarcmb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=(your service role key)
   ```

4. **If any are missing, add them:**
   - Click "Add new environment variable"
   - Enter key and value
   - Click Save

---

## 🧪 Step 3: Test Email Sending

### Test 1: Send a Test Invitation

1. **Open the Oversight app**
   - Log in as SuperUser
   - Go to Super Admin Panel → Invitations

2. **Send a test invitation**
   - Email: **use your own Gmail address** (michaelmokhoro08@gmail.com)
   - Role: Employee
   - Click "Send Invitation"

3. **Check for the email**
   - Open your Gmail inbox
   - Look for email from "noreply@outlook.com" or your configured sender
   - Subject should be: "Welcome to Oversight - Complete Your Account Setup"

### Test 2: Check Supabase Logs (If email didn't arrive)

1. **Go to Supabase Dashboard**
2. **Navigate to Edge Functions**
3. **Click on send-invitation-email function**
4. **Look at the "Logs" tab**
5. **Find your recent invitation attempt**
6. **Look for:**
   - ✅ "Attempting to send email via Resend" - Email was attempted
   - ✅ "Email sent successfully via Resend" - Email was sent
   - ❌ "RESEND_API_KEY not configured" - Environment variable missing
   - ❌ "Resend error 401" - API key is wrong or expired
   - ❌ "Resend error 400" - Email format issue (sender email)

### Test 3: Check Resend Dashboard

1. **Go to https://resend.com**
2. **Log in to your account**
3. **Click "Emails" or "Logs"**
4. **Look for:**
   - Your test invitation email
   - Status: "Delivered" or "Bounced"
   - If bounced, check the reason (invalid recipient, sender not verified, etc.)

---

## 🔧 Troubleshooting

### Issue 1: Email Not Arriving

**Check 1: Is Resend API Key valid?**
```
Symptom: Supabase logs show "Resend error 401"
Solution: 
1. Go to https://resend.com
2. Get your API key from the dashboard
3. Verify it starts with "re_"
4. Update RESEND_API_KEY in Supabase Function settings
5. Redeploy the function
```

**Check 2: Is sender email verified?**
```
Symptom: Supabase logs show error about sender email
Solution:
1. Go to https://resend.com → Settings → Domains
2. Look for "Verified Senders" section
3. If michaelmokhoro08@gmail.com is NOT listed, verify it:
   - Click "Add Domain" or "Verify Email"
   - Follow Resend's verification process
   - Once verified, update EMAIL_FROM in Supabase
4. Redeploy the function
```

**Check 3: Is the function deployed?**
```
Symptom: Supabase logs show no entry for your invitation
Solution:
1. Go to Edge Functions → send-invitation-email
2. Click "Deploy" button again
3. Wait for "Deployment successful"
4. Try sending invitation again
```

### Issue 2: Supabase Logs Show "RESEND_API_KEY not configured"

```
Solution:
1. Edge Functions → Settings
2. Search for RESEND_API_KEY variable
3. If not found, click "Add new environment variable"
4. Key: RESEND_API_KEY
5. Value: re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy
6. Click Save
7. Redeploy the function
```

### Issue 3: Email arrives but link doesn't work

```
Symptom: User clicks link in email, gets 404 error
Solution:
1. Check that your app is deployed at the correct domain
2. Invitation link should look like: https://yourdomain.com/invite?token=XXX&email=user@example.com
3. If testing locally (localhost), emails won't work properly
4. Deploy to production domain first
```

---

## 📧 What Users Will Receive

When a SuperAdmin sends an invitation, users receive a professional HTML email with:

- **Welcome Header** with "Oversight!" branding
- **Clear Invitation Message** stating their role
- **Big Blue Button** to "Accept Invitation & Create Password"
- **Backup Link** (copyable) in case button doesn't work
- **Role & Department Info** displayed
- **Expiry Date** (7 days from now)
- **Footer** with admin contact info

---

## 🔍 Email Flow Diagram

```
SuperAdmin sends invitation
        ↓
Frontend validates email/role
        ↓
Optimistic UI update (instant)
        ↓
Insert to Supabase invitations table (background)
        ↓
Trigger send-invitation-email Edge Function (background)
        ↓
Edge Function:
  ├─ Get email template from database
  ├─ Format email with user details
  ├─ Send via Resend API
  └─ Return success/error
        ↓
User receives email (1-2 minutes)
        ↓
User clicks invite link
        ↓
Signup page loads with pre-filled email
        ↓
User creates password & account
        ↓
Auto-redirect to login
        ↓
User logs in and accesses portal by role
```

---

## ✨ Testing Checklist

- [ ] Redeploy Edge Function with new code
- [ ] Verify RESEND_API_KEY is set in Supabase
- [ ] Verify EMAIL_FROM is set in Supabase
- [ ] Verify sender email is verified in Resend
- [ ] Send test invitation to your email
- [ ] Check inbox for email (wait 1-2 minutes)
- [ ] Click link in email
- [ ] Complete signup
- [ ] Verify auto-redirect to portal
- [ ] Check browser console for any errors

---

## 📞 Quick Reference

**Supabase Dashboard URL:**
https://app.supabase.com/project/mknamvkplhusntnarcmb

**Resend Dashboard URL:**
https://resend.com

**To check logs:**
Supabase → Edge Functions → send-invitation-email → Logs tab

**Common errors in logs:**
- `RESEND_API_KEY not set` → Add env var
- `Resend error 401` → Wrong API key
- `Resend error 400` → Sender email not verified
- `Email sent successfully` → ✅ Working!

---

## 🎯 Next Steps

1. **Redeploy the Edge Function** (updated code with better error handling)
2. **Verify environment variables** in Supabase
3. **Send test invitation** to your email
4. **Check Supabase logs** if email doesn't arrive
5. **Debug using logs** to see exactly where it fails

Once you complete these steps, users will receive invitation emails and can sign up! 🎉

---

## 💡 Pro Tips

- **Test emails take 1-2 minutes to arrive** (normal for Resend)
- **Check spam folder** if email doesn't appear in inbox
- **Supabase logs are your friend** - they show exactly what's happening
- **Each invitation gets a unique token** - can't be reused
- **Invitations expire after 7 days** - users will need new invite if they wait too long
- **Users can request resend** if they don't get the first email
