# Email Delivery Issue - Diagnostics & Fix

## Problem Summary
Invitations show as "Sent" in the UI and Resend accepts the request, but emails aren't reaching recipients' inboxes.

**Root Cause:** Likely an unverified or misconfigured sender email domain in Resend.

---

## Step 1: Run Diagnostics

Call the new diagnostic Edge Function from your frontend or API:

```bash
# Using JavaScript/Fetch
const result = await supabase.functions.invoke('diagnose-email-setup')
console.log(result.data)
```

Or access it via Supabase dashboard:
- Go to **Functions → diagnose-email-setup**
- Click **Invoke**
- Check the response for issues

---

## Step 2: Check Your Configuration

The diagnostic output will show:

### ✅ What should be configured:
- `email_from_configured: true` - EMAIL_FROM environment variable is set
- `email_from_value: "noreply@yourdomain.com"` (or similar verified domain)
- `resend_api_key_set: true`
- `resend_api_key_valid: true`

### ⚠️ Common Issues Found:

#### Issue 1: EMAIL_FROM Not Configured
```
email_from_configured: false
email_from_value: "NOT SET (will use default: noreply@oversight.local)"
```

**Fix:**
1. Go to **Supabase Dashboard → Functions → Settings → Environment Variables**
2. Add: `EMAIL_FROM` = `noreply@yourdomain.com` (or another verified sender)
3. Save and redeploy

#### Issue 2: Sender Email Not Verified in Resend
```
resend_connectivity.status_code: 403
warnings: ["CRITICAL: Sender email is not verified in Resend (HTTP 403)"]
```

**Fix:**
1. Go to **Resend Dashboard → Sender Identity**
2. Verify your sender email domain
3. Once verified, update `EMAIL_FROM` in Supabase to use this verified email

---

## Step 3: Verify in Resend Dashboard

1. **Check Activity/Logs:**
   - Look for emails sent to `Michaelmokhoro08@gmail.com`
   - Check delivery status (should show "Delivered", not "Bounced" or "Blocked")

2. **Verify Sender Domain:**
   - Go to **Sender Identity**
   - Ensure your sender email is marked as "Verified"
   - If not verified, complete the verification process

3. **Check SPF/DKIM records** (if using custom domain)
   - These are required for reliable email delivery

---

## Step 4: Test Email Sending

After fixing configuration:

1. Resend a test invitation to a known email address
2. Check if it arrives within 1-2 minutes
3. If still not arriving, check recipient's spam/junk folder
4. If in spam, your email provider may need SPF/DKIM records

---

## Common Sender Email Options

Choose one and verify in Resend:

### Option A: Resend Default Domain (Easiest)
- Resend provides a default domain for new users
- Typically: `onboarding@resend.dev` or similar
- Already verified, just set `EMAIL_FROM` to this

### Option B: Custom Domain (Professional)
- Use your own domain: `noreply@yourdomain.com`
- Requires domain verification in Resend
- Requires SPF/DKIM DNS records
- Takes 15-30 minutes to set up

### Option C: Production Email
- Use your main company email: `support@yourdomain.com`
- Same requirements as Option B

---

## Environment Variables to Set

In **Supabase Dashboard → Functions → Settings → Environment Variables**, ensure:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx  (must start with "re_")
EMAIL_FROM=noreply@yourdomain.com       (must be verified in Resend)
```

---

## Testing Checklist

After making changes:

- [ ] Run diagnostics - no warnings/errors
- [ ] EMAIL_FROM is configured and shows a verified domain
- [ ] Resend API key is valid
- [ ] Send test invitation
- [ ] Check recipient receives email within 2 minutes
- [ ] Check spam/junk folders if not in inbox
- [ ] Check Resend dashboard activity shows "Delivered"

---

## If Still Not Working

After verifying configuration:

1. **Check Email Provider Settings:**
   - Gmail: Check spam folder, mark as not spam
   - Outlook: Check junk folder
   - Other providers: Check spam/filter settings

2. **Check Resend Dashboard:**
   - Click email record
   - Look for delivery reason if bounced/blocked
   - Check if domain SPF/DKIM is configured

3. **Review Email Content:**
   - Avoid spam-trigger words
   - Keep formatting clean
   - Avoid excessive links/images

4. **Wait & Retry:**
   - Sometimes there are temporary delays
   - Wait 5-10 minutes and retry
   - Check if invitation record is in database

---

## Database Verification

The invitation record is already in the database (verified):
- **Email:** Michaelmokhoro08@gmail.com
- **Status:** pending
- **Created:** 2025-10-22 16:50:58

The issue is **only with email delivery**, not with the invitation system itself.
