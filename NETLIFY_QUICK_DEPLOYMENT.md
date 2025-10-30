# ⚡ Quick Netlify Deployment - 5 Steps to Live

## 🎯 Your Deployment Info

```
Site Name: oversightdemo
URL: https://oversightdemo.netlify.com
Auto-Deploy: GitHub (main branch)
Build Time: ~2-3 minutes
```

---

## 5-Step Deployment Process

### ✅ STEP 1: Connect GitHub (2 min)

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub**
4. Choose: **`Ultronjnr/Oversight-system`**
5. Branch: **`main`**
6. Build command: `npm run build` ✅ (already set)
7. Publish: `dist` ✅ (already set)
8. Click **"Deploy site"**

✅ **Netlify creates your site and starts first build**

---

### ✅ STEP 2: Add 4 Environment Variables (2 min)

While building, set variables in **Site settings → Build & deploy → Environment**:

```
VITE_SUPABASE_URL = https://mknamvkplhusntnarcmb.supabase.co

VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbmFtdmtwbGh1c250bmFyY21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTM5NDYsImV4cCI6MjA3NTg2OTk0Nn0.vl_iAlbiAl6VyJ-oikpKqaYNfhr0P9Dltr7Jpn74LrI

EMAIL_FROM = noreply@oversight.global

RESEND_API_KEY = re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy
```

✅ **Click Save**

---

### ✅ STEP 3: Rebuild with Variables (2 min)

1. Go to **Builds** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete

✅ **Build should show as "Published" (green)**

---

### ✅ STEP 4: Test Your Site (2 min)

Visit: **https://oversightdemo.netlify.com**

You should see:
- ✅ Login page loads
- ✅ Oversight branding visible
- ✅ Email & password fields work

---

### ✅ STEP 5: Test Complete Flow (3 min)

1. Login with: `noreply@oversight.global` / `SuperAdmin2025`
2. Go to `/super-admin`
3. Send test invitation
4. Check email received
5. User completes signup
6. User can login to portal

✅ **Everything working?**

---

## 🎉 You're Live!

Your site is now at: **https://oversightdemo.netlify.com**

---

## Auto-Deploy from GitHub

Now every time you push code:
```bash
git push origin main
```

Netlify automatically:
1. Pulls latest code
2. Runs `npm run build`
3. Publishes to oversightdemo.netlify.com
4. Takes ~2-3 minutes

---

## ✅ Deployment Checklist

- [ ] Site created on Netlify
- [ ] GitHub connected
- [ ] 4 environment variables set
- [ ] Site rebuilt with variables
- [ ] Can access https://oversightdemo.netlify.com
- [ ] Login page works
- [ ] Can login as super admin
- [ ] Can send invitations
- [ ] Emails are received
- [ ] Users can complete signup
- [ ] All portals work

---

**You're done! Your Oversight system is live!** 🚀
