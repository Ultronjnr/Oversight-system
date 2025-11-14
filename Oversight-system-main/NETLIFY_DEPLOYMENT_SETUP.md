# 🚀 Netlify Deployment Setup Guide

## Overview
This guide provides step-by-step instructions for deploying the Oversight Procurement Management System to Netlify with proper environment variable configuration.

## ✅ Pre-Deployment Checklist

### 1. **Build Verification** ✅
- ✅ `npm install` - Dependencies installed
- ✅ `npm run build` - Production build successful
- ✅ BrowserRouter configured in `App.tsx`
- ✅ `_redirects` file created in `public/` for SPA routing
- ✅ `netlify.toml` configured with proper redirects

### 2. **Environment Variables Setup**

Your project is configured to use the following environment variable structure:

#### **Frontend Variables (React Build)**
Add these in **Netlify → Site Settings → Environment → Environment Variables**:
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://erpjzgxxcgozqzmjubtw.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycGp6Z3h4Y2dvenF6bWp1YnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzYxOTgsImV4cCI6MjA3NDExMjE5OH0._6HKXe2D0aEtGUnjqWLgjTeKewCLMhJmMwHBtidYh9A

# API Configuration
REACT_APP_API_URL=https://api.oversight-system.co.za

# Feature Flags
REACT_APP_ENABLE_EMAIL_NOTIFICATIONS=true
REACT_APP_ENABLE_FILE_UPLOADS=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_AUDIT_LOGS=true

# Application Info
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_DATE=2025-09-23
```

#### **Backend Secrets (Mark as "Secret" in Netlify)**
These are only accessible to Netlify Functions and should be marked as "Secret":

```bash
# Database Configuration
DATABASE_URL=postgresql://oversight_user:<your_secure_password>@db-host:5432/oversight_db
DATABASE_USER=oversight_user
DATABASE_PASSWORD=<your_secure_password>
DATABASE_NAME=oversight_db
DATABASE_HOST=db-host
DATABASE_PORT=5432

# Authentication & Security
JWT_SECRET=zuRQcUMhjsHEXP/56WoJ9LiMAN/MvJ3ALU0g4YCTGp5JOAxyXojcZCnW/4dFMVRv3OGuppHpGHuhIhjeeVMSkg==
SESSION_SECRET=<another_super_secure_random_string_here>

# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycGp6Z3h4Y2dvenF6bWp1YnR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODUzNjE5OCwiZXhwIjoyMDc0MTEyMTk4fQ.vBnbjuAJ_3cCgWXtYBn0tgewX5Vl1Yo4CvD_7OjdXm0

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=michaelmokhoro08@gmail.com
SMTP_PASSWORD=<your_email_app_password>
SMTP_FROM=admin@oversight.co.za

# Security Settings
CORS_ORIGIN=https://oversight-system.co.za
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 Netlify Configuration

### Build Settings
- **Publish Directory**: `dist`
- **Build Command**: `npm run build`
- **Functions Directory**: `netlify/functions`

### SPA Routing Configuration
Already configured with:
- `public/_redirects` file: `/*    /index.html   200`
- `netlify.toml` redirects: `from = "/*" to = "/index.html" status = 200`

### Environment Variables in Netlify
1. Go to **Site Settings → Environment → Environment Variables**
2. Add all `REACT_APP_*` variables (these are safe for frontend)
3. Add backend secrets and mark them as **"Secret"**

## 📁 Project Structure

```
├── src/
│   ├── lib/supabaseClient.ts     # ✅ Uses REACT_APP_SUPABASE_*
│   ├── services/
│   │   ├── api.ts               # ✅ Uses REACT_APP_API_URL
│   │   └── apiService.ts        # ✅ Uses REACT_APP_API_URL
│   └── App.tsx                  # ✅ Uses BrowserRouter
├── public/
│   └── _redirects               # ✅ SPA routing configured
├── netlify/
│   └── functions/              # ✅ Serverless functions
├── netlify.toml                # ✅ Build & redirect configuration
└── .env                        # ✅ Local development variables
```

## 🚀 Deployment Steps

### 1. **Connect Repository**
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub/GitLab repository
4. Select the repository containing this project

### 2. **Configure Build Settings**
```
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

### 3. **Add Environment Variables**
- Add all `REACT_APP_*` variables as regular environment variables
- Add backend secrets and mark them as "Secret"

### 4. **Deploy**
- Click "Deploy site"
- Netlify will build and deploy your application

## 🔐 Security Notes

### ✅ **Secure Practices Implemented**
- Frontend variables use `REACT_APP_` prefix (safe to expose)
- Backend secrets are properly separated
- Service role keys are marked as secret
- CORS origin is configured for production domain
- Rate limiting is configured

### ⚠️ **Important Security Reminders**
- **Never commit** backend secrets to your repository
- **Always mark** sensitive variables as "Secret" in Netlify
- **Use HTTPS** for all production URLs
- **Verify** Supabase redirect URLs match your production domain exactly

## 🧪 Testing Deployment

### 1. **Build Test**
```bash
npm run build
```
Should complete without errors and generate `dist/` folder.

### 2. **Local Preview**
```bash
npm run preview
```
Test the production build locally.

### 3. **Environment Variable Test**
Check browser console for any missing environment variable warnings.

## 🔄 Post-Deployment

### 1. **Verify Functionality**
- [ ] User authentication works
- [ ] Purchase requisitions can be created
- [ ] File uploads work
- [ ] Email notifications are sent
- [ ] All routes work with SPA routing

### 2. **Update Supabase Settings**
- Update auth redirect URLs to match your Netlify domain
- Verify RLS policies are working correctly

### 3. **Monitor**
- Check Netlify function logs
- Monitor error rates
- Verify performance metrics

## 📞 Support

If you encounter issues during deployment:
1. Check Netlify build logs for errors
2. Verify all environment variables are set correctly
3. Ensure backend services are accessible from Netlify
4. Check Supabase configuration and redirect URLs

---

**Your Oversight system is now ready for production deployment! 🎉**
