# 🔍 Blank Screen Debug Guide

## Issue: White/Blank Screen on Netlify Deployment

This guide will help you diagnose and fix the blank screen issue on your Netlify deployment.

## 🚀 Quick Fixes Applied

### 1. **Vite Configuration Updated**
- Added `base: '/'` to ensure correct asset paths
- Configured build options for better asset handling
- Added manual chunk configuration

### 2. **Error Boundary Added**
- Created `ErrorBoundary.tsx` to catch React errors
- Added debugging console logs
- Added error display for development

### 3. **Debugging Components Added**
- Added console logs to track component rendering
- Added environment variable logging
- Created debug info component

## 🔧 Step-by-Step Debugging

### Step 1: Check Browser Console
1. Open your Netlify site
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for any errors (red text)

**Common Errors to Look For:**
```javascript
// Asset loading errors
Failed to load resource: net::ERR_ABORTED
// JavaScript errors
Uncaught TypeError: Cannot read property...
// Environment variable issues
REACT_APP_SUPABASE_URL is undefined
```

### Step 2: Check Network Tab
1. Go to **Network** tab in Developer Tools
2. Refresh the page
3. Look for failed requests (red status codes)

**Common Issues:**
- 404 errors for CSS/JS files
- 500 errors for API calls
- CORS errors

### Step 3: Check Environment Variables
Look in the console for the debug output:
```javascript
Environment: {
  NODE_ENV: "production",
  REACT_APP_SUPABASE_URL: "https://...",
  REACT_APP_API_URL: "https://..."
}
```

If any values are `undefined`, the environment variables aren't set correctly in Netlify.

## 🛠️ Common Solutions

### Solution 1: Environment Variables Not Set
**Problem:** Environment variables are undefined in production

**Fix:**
1. Go to Netlify → Site Settings → Environment Variables
2. Add these variables:
   ```
   REACT_APP_SUPABASE_URL=https://erpjzgxxcgozqzmjubtw.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   REACT_APP_API_URL=https://api.oversight-system.co.za
   ```
3. Redeploy the site

### Solution 2: Asset Path Issues
**Problem:** CSS/JS files not loading (404 errors)

**Fix:**
1. Check if `_redirects` file exists in `public/` folder
2. Ensure it contains: `/*    /index.html   200`
3. Verify `netlify.toml` has correct redirects

### Solution 3: JavaScript Errors
**Problem:** Uncaught errors causing app to crash

**Fix:**
1. Check console for specific error messages
2. Look for the error boundary component (should show error details)
3. Fix the underlying code issue

### Solution 4: Supabase Connection Issues
**Problem:** App can't connect to Supabase

**Fix:**
1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify RLS policies allow public access where needed

## 🧪 Testing Locally

### Test Production Build Locally
```bash
npm run build
npm run preview
```

This will test the exact build that gets deployed to Netlify.

### Check Build Output
```bash
# Check if all files are generated
ls -la dist/
ls -la dist/assets/
```

## 📋 Netlify Deployment Checklist

### Environment Variables (Netlify Dashboard)
- [ ] `REACT_APP_SUPABASE_URL` is set
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is set  
- [ ] `REACT_APP_API_URL` is set
- [ ] All backend secrets are marked as "Secret"

### Build Settings
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Functions directory: `netlify/functions`

### Files in Repository
- [ ] `public/_redirects` exists with `/*    /index.html   200`
- [ ] `netlify.toml` is configured correctly
- [ ] No `.env` file committed (use environment variables instead)

## 🚨 Emergency Fallback

If nothing works, try this minimal test:

1. Create a simple `public/test.html` file:
```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>Test Page Works!</h1>
  <script>
    console.log('JavaScript works!');
  </script>
</body>
</html>
```

2. Deploy and visit `your-site.netlify.app/test.html`
3. If this works, the issue is with the React app
4. If this doesn't work, the issue is with Netlify configuration

## 📞 Next Steps

After checking the above:

1. **If you see errors in console:** Share the specific error messages
2. **If environment variables are undefined:** Check Netlify environment variable setup
3. **If assets aren't loading:** Check file paths and redirects
4. **If still blank:** Check if the error boundary is showing any errors

## 🔄 Redeploy Instructions

After making changes:
1. Commit changes to your repository
2. Netlify will automatically redeploy
3. Or manually trigger redeploy in Netlify dashboard
4. Wait for build to complete
5. Test the live site

---

**The debug components added will help identify the exact issue. Check the browser console for detailed information!**
