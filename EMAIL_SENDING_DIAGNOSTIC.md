# Email Sending Diagnostic Guide

## Issue: Users Not Receiving Invitation Links

If users are not receiving invitation emails, follow these diagnostic steps in order:

### STEP 1: Verify Resend API Key Format ⚠️

Your Resend API key should start with `re_` followed by characters. Based on the key provided, ensure it's **complete and valid**.

**Expected format:**
```
re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Action Items:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to **Settings → API Keys**
3. Copy your API key (the full key starting with `re_`)
4. Verify it's at least 40+ characters long

### STEP 2: Verify Sender Email is Verified in Resend

Your sender email (`Michaelmokhoro08@gmail.com`) must be verified in Resend.

**Action Items:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to **Settings → Verified Domains & Senders**
3. Verify that `Michaelmokhoro08@gmail.com` appears in the list with a **Verified** status
4. If not verified:
   - Click **Add Domain or Email**
   - Follow the verification steps (usually requires email confirmation)
   - Wait for verification to complete

### STEP 3: Set Environment Variables in Supabase

The Edge Function needs access to your Resend API key and sender email.

**Action Items:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **mknamvkplhusntnarcmb**
3. Navigate to **Functions → Settings → Environment Variables**
4. Add/Update the following:
   - **Key:** `RESEND_API_KEY`
   - **Value:** Your complete Resend API key (from STEP 1)
   - Click **Save**
5. Add/Update the second variable:
   - **Key:** `EMAIL_FROM`
   - **Value:** `Michaelmokhoro08@gmail.com`
   - Click **Save**
6. **Deploy the function** if prompted

### STEP 4: Check Supabase Edge Function Logs

This is the most important step to diagnose what's happening.

**Action Items:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **mknamvkplhusntnarcmb**
3. Navigate to **Functions → send-invitation-email**
4. Click the **Logs** tab at the top
5. Try sending an invitation from the Super Admin panel
6. **Check the logs immediately** (within 10 seconds) for:
   - `RESEND_API_KEY not configured` → Environment variable not set
   - `Resend API error` → API key is invalid or sender not verified
   - `Email sent successfully` → Function is working ✅
   - Any other error messages → Note the exact error

### STEP 5: Check Resend Activity Logs

Once you've confirmed the Edge Function is sending requests to Resend, check if Resend received them.

**Action Items:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to **Activity** or **Emails**
3. Look for recent emails sent to your test address
4. Check the status:
   - **Delivered** ✅ → Email sent successfully, might be in spam
   - **Bounced** ❌ → Recipient address invalid or blocked
   - **Rejected** ❌ → Sender not verified or API key invalid

### STEP 6: Check Email Delivery

If the email appears in Resend as "Delivered", check your inbox:

**Action Items:**
1. Check **Inbox** for the invitation email
2. Check **Spam/Junk** folder
3. Check **Promotions** tab (in Gmail, usually)
4. **Create a Resend Verified Domain** instead of using Gmail:
   - This dramatically improves deliverability
   - Go to Resend Dashboard → Add Domain
   - Follow DNS setup instructions
   - Use the domain email instead of Gmail

---

## Quick Checklist

- [ ] Resend API key is complete (starts with `re_` and is 40+ chars)
- [ ] Sender email (`Michaelmokhoro08@gmail.com`) is verified in Resend
- [ ] `RESEND_API_KEY` is set in Supabase Functions → Settings
- [ ] `EMAIL_FROM` is set to `Michaelmokhoro08@gmail.com` in Supabase Functions → Settings
- [ ] Sent a test invitation from Super Admin panel
- [ ] Checked Supabase function logs (see STEP 4)
- [ ] Checked Resend Activity logs (see STEP 5)
- [ ] Email appears in Resend as "Delivered"
- [ ] Checked inbox and spam folder

---

## Common Issues & Solutions

### "RESEND_API_KEY not configured"
**Problem:** Environment variable not set in Supabase  
**Solution:** Follow STEP 3 above, then verify by restarting your dev server

### "Resend API error 401: Unauthorized"
**Problem:** API key is invalid or incomplete  
**Solution:** Go to STEP 1, copy the FULL key (check if you missed any characters), then re-enter in STEP 3

### "Sender not verified"
**Problem:** The `EMAIL_FROM` address isn't verified in Resend  
**Solution:** Follow STEP 2 to verify the sender email in Resend dashboard

### "Email sent but not received"
**Problem:** Email is delivered but going to spam/junk  
**Solution:** 
- Check spam folder
- Use a verified domain instead of Gmail (better deliverability)
- Check your email provider's security settings

### "No logs appear in Supabase"
**Problem:** The function isn't being called at all  
**Solution:**
- Open browser DevTools (F12)
- Go to **Console** tab
- Try sending an invitation
- Look for errors in the console
- Check if the error shows up in the "Email Debug" panel

---

## Testing the Function Directly (Advanced)

If you want to test the Edge Function in isolation:

1. Go to Supabase Dashboard → Functions → send-invitation-email
2. Click **Execute** button
3. Use this test payload:
```json
{
  "email": "your-test-email@gmail.com",
  "role": "Employee",
  "department": "IT",
  "inviterEmail": "admin@oversight.local",
  "inviteLink": "https://yourapp.com/invite?token=test123&email=your-test-email@gmail.com"
}
```
4. Click **Send**
5. Check the response and logs

---

## Need Help?

If you've completed all steps and emails still aren't working:

1. **Share the exact error** from Supabase logs (STEP 4)
2. **Share the Resend Activity** status for the test email (STEP 5)
3. **Check browser console** for any JavaScript errors
4. Contact Resend support: https://resend.com/support
