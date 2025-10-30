# How to Read Supabase Function Logs - Email Sending

When you send an invitation, the Edge Function logs will show you exactly what happened. This guide explains how to read and interpret these logs.

---

## Where to Find the Logs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: **mknamvkplhusntnarcmb**
3. Navigate to **Functions** in the left sidebar
4. Click on **send-invitation-email**
5. Click the **Logs** tab at the top

The logs will show in real-time as the function executes.

---

## Reading the Logs - Top to Bottom

When you send an invitation, you'll see logs that tell the complete story. Here's what each log message means:

### 1️⃣ Function Called
```
🚀 Invitation email function called: { method: "POST", url: "...", timestamp: "2024-01-15T10:30:45Z" }
```
✅ **Meaning:** The function was triggered and is running  
❓ **If missing:** The frontend didn't call the function

### 2️⃣ Request Received
```
📋 Request received: { email: "user@...", role: "Employee", department: "IT", hasInviteLink: true, ... }
```
✅ **Meaning:** The function received the invitation request with the correct data  
❓ **If missing:** Network issue or function didn't receive data

### 3️⃣ Request Validation
```
✅ Request validation passed
```
✅ **Meaning:** Email, role, and invite link are all provided and valid  
❌ **If you see:** `❌ Missing required fields` → The frontend is not sending all required data

### 4️⃣ Template Loading (Optional)
```
🔍 Attempting to fetch custom email template from Supabase...
✅ Custom email template loaded successfully
```
OR
```
⚠️ Could not fetch custom template (using default)
```
ℹ️ **Meaning:** System tried to load a custom email template. Both outcomes are fine - will use default if custom not found.

### 5️⃣ Email Content Prepared
```
📝 Using default email template
📧 Email prepared: { to: "user@example.com", subject: "Welcome to Oversight - Complete...", htmlLength: 2547 }
```
✅ **Meaning:** Email HTML content was built successfully  
❓ **If missing:** Error building the email

### 6️⃣ Environment Variables Check
```
✅ Environment variables configured: { apiKeyLength: 50, apiKeyPrefix: "re_NuxUVPn...", fromEmail: "Michaelmokhoro08@gmail.com" }
```
✅ **Meaning:** RESEND_API_KEY and EMAIL_FROM are both set correctly  
❌ **If you see:** `❌ RESEND_API_KEY environment variable is not set` → Add it in Functions → Settings

### 7️⃣ Attempting to Send
```
⏳ Sending email via Resend...
📧 Attempting to send email via Resend: { to: "user@example.com", from: "Michaelmokhoro08@gmail.com", subject: "..." }
📤 Making request to Resend API endpoint: https://api.resend.com/emails
```
✅ **Meaning:** Function is contacting Resend's servers  
❌ **If missing:** Function crashed before reaching Resend

### 8️⃣ Response from Resend (Success)
```
📨 Resend API response status: 200
✅ Email sent successfully via Resend: { messageId: "1234567890", to: "user@example.com", timestamp: "..." }
✅ SUCCESS: Email sent via Resend
```
✅ **Meaning:** Email was successfully sent by Resend!  
**Next step:** Check Resend Activity and your inbox

---

## Error Messages - What They Mean

### ❌ RESEND_API_KEY Not Configured
```
❌ RESEND_API_KEY environment variable is not set
```
**Problem:** Environment variable missing  
**Solution:**
1. Go to Supabase Dashboard → Functions → Settings
2. Add `RESEND_API_KEY` with your full Resend API key
3. Click Save
4. Wait 30 seconds
5. Try sending another invitation

---

### ❌ RESEND_API_KEY Format Invalid
```
❌ RESEND_API_KEY format is invalid
hint: API key should start with "re_" and be at least 40+ characters
```
**Problem:** API key is incomplete or wrong format  
**Solution:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Navigate to Settings → API Keys
3. Copy the **full** API key (check length - should be 50+ characters)
4. Update in Supabase Functions → Settings
5. Verify it starts with `re_`

---

### ❌ Sender Not Verified (401 Error)
```
Resend API response status: 401
Sender email is not verified in Resend. Go to Resend Dashboard → Verified Domains & Senders to verify
```
**Problem:** The sender email isn't verified in Resend  
**Solution:**
1. Go to [Resend Dashboard](https://dashboard.resend.com)
2. Click **Verified Domains & Senders**
3. Check if `Michaelmokhoro08@gmail.com` is listed as **Verified**
4. If not, click **Add Email** and complete verification
5. Try sending another invitation

---

### ❌ Sender Not Verified (403 Error)
```
Resend API response status: 403
```
**Problem:** This is usually also a sender verification issue  
**Solution:** Same as above - verify your sender email in Resend

---

### ❌ Invalid Email Format
```
Resend API response status: 422
Invalid email format or domain issue
```
**Problem:** The email address being invited is invalid  
**Solution:**
1. Check the email address in the invitation form
2. Ensure it's a valid format: `user@example.com`
3. Try again with a different email

---

### ❌ Rate Limited
```
Resend API response status: 429
Rate limit exceeded
```
**Problem:** Too many emails sent too quickly  
**Solution:** Wait a few minutes before trying again

---

### ❌ Resend Service Error
```
Resend API response status: 500
Resend service error. Try again in a few moments
```
**Problem:** Temporary issue with Resend service  
**Solution:** Wait a minute and try again

---

### ❌ Network Error
```
Error communicating with Resend API: { message: "fetch failed", ... }
```
**Problem:** Can't reach Resend servers (unlikely)  
**Solution:**
1. Check your internet connection
2. Verify Resend is not having outages: [Resend Status](https://status.resend.com)
3. Try again in a minute

---

## Complete Success Scenario (All Logs)

Here's what a **successful** invitation looks like:

```
🚀 Invitation email function called: { method: "POST", timestamp: "2024-01-15T10:30:45Z" }
📋 Request received: { email: "newuser@company.com", role: "Employee", department: "IT", hasInviteLink: true }
✅ Request validation passed
🔍 Attempting to fetch custom email template from Supabase...
⚠️ Could not fetch custom template (using default)
📝 Using default email template
📧 Email prepared: { to: "newuser@company.com", subject: "Welcome to Oversight - Complete...", htmlLength: 2547 }
✅ Environment variables configured: { apiKeyLength: 50, apiKeyPrefix: "re_NuxUVPn...", fromEmail: "Michaelmokhoro08@gmail.com" }
⏳ Sending email via Resend...
📧 Attempting to send email via Resend: { to: "newuser@company.com", from: "Michaelmokhoro08@gmail.com" }
📤 Making request to Resend API endpoint: https://api.resend.com/emails
📨 Resend API response status: 200
✅ Email sent successfully via Resend: { messageId: "52d69d98-fa2f-48c5-bf6c-a819a1cf75b2", to: "newuser@company.com" }
✅ SUCCESS: Email sent via Resend
```

When you see this, the email has been sent successfully! ✅

**Next steps:**
1. Check the user's email inbox
2. Email should arrive in 30-60 seconds
3. If not received, check Spam folder
4. If still not found, check Resend Activity dashboard

---

## Debugging Checklist

After sending a test invitation, check these in order:

- [ ] **Step 1:** Function Logs show "🚀 Invitation email function called" → Function is being invoked ✅
- [ ] **Step 2:** Logs show "📋 Request received" → Frontend is sending data correctly ✅
- [ ] **Step 3:** Logs show "✅ Request validation passed" → Data format is correct ✅
- [ ] **Step 4:** Logs show "✅ Environment variables configured" → API key is set ✅
- [ ] **Step 5:** Logs show "⏳ Sending email via Resend..." → About to send email ✅
- [ ] **Step 6:** Logs show "Resend API response status: 200" → Resend accepted the email ✅
- [ ] **Step 7:** Logs show "✅ SUCCESS: Email sent via Resend" → Email sent successfully ✅

If any step is missing or shows ❌, that's where the issue is.

---

## Quick Decision Tree

```
Did you see "🚀 Invitation email function called"?
├─ NO → Frontend not calling function
│   └─ Check browser console for errors
│       Use: F12 → Console tab → Try sending again
│
└─ YES → Continue to next step
    │
    Did you see "✅ Request validation passed"?
    ├─ NO → Invalid request data
    │   └─ Check the error message in logs
    │
    └─ YES → Continue
        │
        Did you see "✅ Environment variables configured"?
        ├─ NO → Missing RESEND_API_KEY or EMAIL_FROM
        │   └─ Go to Functions → Settings → Add Environment Variables
        │
        └─ YES → Continue
            │
            Did you see "Resend API response status: 200"?
            ├─ NO → Resend API error
            │   └─ Read the error message above - follow solution
            │
            └─ YES → Email sent successfully ✅
                └─ Check your inbox!
                   └─ Not there? → Check Spam
                   └─ Still not? → Check Resend Activity
```

---

## Collecting Information for Support

If you need help, collect this information:

1. **Screenshot of Function Logs** - showing the error
2. **Resend API Key Status** - screenshot from Resend Dashboard → Settings
3. **Verified Senders** - screenshot from Resend Dashboard → Verified Domains & Senders
4. **Resend Activity** - screenshot showing the test email status
5. **Environment Variables** - screenshot from Supabase Functions → Settings (hide the actual API key)

This will help diagnose the issue quickly.

---

## Real-Time Log Monitoring

To see logs as they happen:

1. Open the Logs tab
2. Send an invitation from the app
3. **Watch the logs in real-time** - they appear immediately
4. Don't refresh the page during sending
5. The logs show in reverse chronological order (newest first)

---

**Next Step:** Send a test invitation and share the logs! 📋
