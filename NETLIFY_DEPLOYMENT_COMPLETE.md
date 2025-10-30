# 🚀 Netlify Deployment Guide - oversightdemo.netlify.com

## Deployment Summary

Your Oversight system is ready to deploy to Netlify with:
- **Site Name:** `oversightdemo`
- **URL:** `https://oversightdemo.netlify.com`
- **Auto-Deploy:** From GitHub on every push
- **Build Command:** `npm run build` (Vite)
- **Publish Directory:** `dist/`

---

## Step-by-Step Deployment Instructions

### STEP 1: Connect GitHub to Netlify (5 minutes)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as your Git provider
4. Select your repository: **`Ultronjnr/Oversight-system`**
5. Click **"Connect"**

**Build Settings:**
- **Branch to deploy:** `main` (or your main branch)
- **Build command:** `npm run build` (already set)
- **Publish directory:** `dist` (already set)

✅ **Click "Deploy site"**

The site will be created as: `oversightdemo` → `https://oversightdemo.netlify.com`

---

### STEP 2: Set Environment Variables (3 minutes)

**While the first build is running, set environment variables:**

1. In Netlify Dashboard, go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"** or **"Add environment variable"**

**Add these 4 variables:**

#### Variable 1: Supabase URL
```
Key: VITE_SUPABASE_URL
Value: https://mknamvkplhusntnarcmb.supabase.co
```

#### Variable 2: Supabase Anon Key
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbmFtdmtwbGh1c250bmFyY21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTM5NDYsImV4cCI6MjA3NTg2OTk0Nn0.vl_iAlbiAl6VyJ-oikpKqaYNfhr0P9Dltr7Jpn74LrI
```

#### Variable 3: Email From
```
Key: EMAIL_FROM
Value: noreply@oversight.global
```

#### Variable 4: Resend API Key
```
Key: RESEND_API_KEY
Value: re_NuxUVPnY_HvPs2w3KSbj6MV6wN8vRn4qy
```

✅ **Click "Save"**

---

### STEP 3: Trigger Rebuild (2 minutes)

After setting environment variables:

1. Go to **Builds** tab in Netlify
2. Click **"Trigger deploy"** → **"Deploy site"**

This will rebuild the site with the environment variables.

✅ **Wait for build to complete (2-3 minutes)**

---

### STEP 4: Verify Deployment (2 minutes)

1. After build completes, go to **Deploys** tab
2. Check the latest deploy status:
   - ✅ **Published** (green) = Success!
   - ❌ **Failed** (red) = Check logs for errors

3. Visit your site: **https://oversightdemo.netlify.com**

✅ **You should see the Oversight login page!**

---

### STEP 5 (Optional): Connect Custom Domain

If you want to use `oversight.global` instead of `oversightdemo.netlify.com`:

1. In Netlify, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `oversight.global`
4. Follow DNS setup instructions
5. Point your domain DNS to Netlify nameservers

✅ **Domain connected!**

---

## Verification Checklist

After deployment, verify everything works:

### Frontend
- [ ] Login page loads at `https://oversightdemo.netlify.com/login`
- [ ] Can see the Oversight branding
- [ ] Can see email input with placeholder
- [ ] Can see password input

### Authentication
- [ ] Login with: `noreply@oversight.global` / `SuperAdmin2025`
- [ ] Successfully logged in
- [ ] Redirected to dashboard

### Super Admin Panel
- [ ] Can access `/super-admin`
- [ ] Can see **Invitations** tab
- [ ] Can send test invitation
- [ ] Debug panel shows email status

### Email System
- [ ] Invitation email received
- [ ] Email from: `noreply@oversight.global`
- [ ] User can click link and complete signup
- [ ] User can login after signup

### Database Connection
- [ ] User data saved in Supabase
- [ ] Invitations appear in `invitations` table
- [ ] Users appear in `users` table

---

## Auto-Deployment from GitHub

**How it works:**

1. ✅ GitHub connected to Netlify
2. ✅ Every time you push to `main` branch, Netlify automatically:
   - Pulls latest code
   - Runs `npm run build`
   - Publishes to `oversightdemo.netlify.com`
   - Takes ~2-3 minutes

**To deploy changes:**
```bash
git add .
git commit -m "Your message"
git push origin main
```

✅ **Netlify will automatically deploy!**

---

## Netlify Build Configuration (netlify.toml)

Your `netlify.toml` file (already created) includes:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  node_version = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures:
- ✅ Vite builds correctly
- ✅ React Router SPA routing works
- ✅ All routes redirect to index.html
- ✅ Static assets are cached

---

## Troubleshooting Deployment Issues

### Build Failed in Netlify

**Check logs:**
1. Go to **Builds** tab
2. Click on the failed build
3. Click **"Deploy log"** tab
4. Look for the error message

**Common causes:**
- Missing environment variables → Add them in Site settings
- Outdated dependencies → Run `npm install` locally and push
- Build script error → Run `npm run build` locally to test

### Site Not Loading

**Check:**
1. Netlify deploy status (is it green/published?)
2. Browser cache (Ctrl+Shift+Del to clear)
3. DNS propagation (if using custom domain)
4. Check browser console (F12) for errors

### Environment Variables Not Working

**If things break after deploying:**
1. Verify all 4 variables are set in Netlify
2. Check variable names are exact (case-sensitive)
3. Check values don't have extra spaces
4. Trigger rebuild after setting variables

### Still Having Issues?

1. Check Netlify documentation: https://docs.netlify.com
2. Check Vite documentation: https://vitejs.dev/config/
3. Check your build logs in Netlify Dashboard
4. Ask in Netlify support

---

## Production Checklist

Before going to production with `oversight.global`:

- [ ] Test complete workflow at `oversightdemo.netlify.com`
- [ ] Verify email sending works
- [ ] Test all role types (Employee, HOD, Finance, Admin)
- [ ] Test on mobile devices
- [ ] Test in different browsers
- [ ] Check performance (Lighthouse score)
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups for database
- [ ] Set up email delivery monitoring (Resend)
- [ ] Document deployment process
- [ ] Create runbook for operations team

---

## Manual Deployment (If Needed)

If you want to manually build and deploy:

**Option 1: Netlify CLI**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

**Option 2: Drag & Drop**
1. Build locally: `npm run build`
2. Go to Netlify Dashboard
3. Drag the `dist` folder into the deploy zone
4. Done! (no git needed)

---

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://mknamvkplhusntnarcmb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGc...` |
| `EMAIL_FROM` | Email sender address | `noreply@oversight.global` |
| `RESEND_API_KEY` | Resend API key | `re_NuxUVPnY...` |

---

## Post-Deployment

After successful deployment:

1. **Tell your team:**
   - Demo URL: `https://oversightdemo.netlify.com`
   - Credentials: `noreply@oversight.global` / `SuperAdmin2025`

2. **Test with real users:**
   - Send invitations from super admin
   - Have them signup and test
   - Collect feedback

3. **Monitor:**
   - Netlify Analytics (traffic, performance)
   - Supabase Logs (database, auth, errors)
   - Resend Activity (email delivery)
   - Browser Console (frontend errors)

4. **Next steps:**
   - Point `oversight.global` to Netlify
   - Go live with real data
   - Scale to production

---

## Success Indicators

✅ **Deployment successful when:**
- ✅ Netlify shows "Published" status
- ✅ Can access `https://oversightdemo.netlify.com`
- ✅ Login page loads
- ✅ Can login as super admin
- ✅ Can send invitations
- ✅ Emails are received
- ✅ Users can signup and login
- ✅ All portals work correctly

---

## Support

- **Netlify Docs:** https://docs.netlify.com
- **GitHub Integration:** https://docs.netlify.com/integrations/github/
- **Environment Variables:** https://docs.netlify.com/configure-builds/environment-variables/
- **Build Logs:** Check in Netlify Dashboard → Deploys → Build logs

---

## Next Steps

1. ✅ Click "Add new site" in Netlify
2. ✅ Connect GitHub repository
3. ✅ Set 4 environment variables
4. ✅ Trigger rebuild
5. ✅ Verify at `oversightdemo.netlify.com`
6. ✅ Test complete workflow
7. ✅ Go live! 🚀

---

**Your Oversight system is ready for the world!** 🎉
