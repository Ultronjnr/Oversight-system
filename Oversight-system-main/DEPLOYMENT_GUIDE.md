# Oversight Procurement Management System - Deployment Guide

This guide will help you deploy the Oversight Procurement Management System to Netlify with a fully functional backend using Supabase.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a name for your project (e.g., "oversight-procurement")
3. Set a strong database password
4. Select a region close to your users

### 1.2 Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script to create all necessary tables
4. Verify that the tables were created successfully

### 1.3 Get Supabase Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

## Step 2: Configure Environment Variables

### 2.1 Create Environment File

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your actual values:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=production
   ```

### 2.2 Generate JWT Secret

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 3: Deploy to Netlify

### 3.1 Connect Repository

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Connect your Git provider and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 3.2 Set Environment Variables in Netlify

1. Go to Site settings > Environment variables
2. Add the following variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `JWT_SECRET`: Your generated JWT secret
   - `NODE_ENV`: `production`

### 3.3 Deploy

1. Click "Deploy site"
2. Wait for the build to complete
3. Your site will be available at `https://your-site-name.netlify.app`

## Step 4: Test the Application

### 4.1 Default Login Credentials

The following users are created by default:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| admin@company.com | admin123 | Admin | Administration |
| superuser@company.com | admin123 | SuperUser | System |
| employee@company.com | admin123 | Employee | IT |
| hod@company.com | admin123 | HOD | IT |
| finance@company.com | admin123 | Finance | Finance |

### 4.2 Test Features

1. **Login**: Test with different user roles
2. **Create Purchase Requisition**: Create a new PR as an employee
3. **Approve/Decline**: Test HOD and Finance approval workflows
4. **Analytics**: View analytics dashboard
5. **User Management**: Test admin functions

## Step 5: Customize for Production

### 5.1 Update Default Passwords

1. Log in to your Supabase dashboard
2. Go to Authentication > Users
3. Update passwords for all default users
4. Consider implementing password reset functionality

### 5.2 Configure Email (Optional)

1. Set up SMTP credentials in Supabase
2. Configure email templates for notifications
3. Update environment variables with SMTP settings

### 5.3 Set Up Custom Domain (Optional)

1. In Netlify, go to Domain settings
2. Add your custom domain
3. Configure DNS settings as instructed
4. Enable HTTPS

## Step 6: Monitor and Maintain

### 6.1 Monitor Performance

1. Use Netlify Analytics to monitor site performance
2. Check Supabase dashboard for database metrics
3. Monitor function execution in Netlify Functions

### 6.2 Regular Backups

1. Set up automated database backups in Supabase
2. Consider implementing data export functionality
3. Monitor storage usage and costs

## Troubleshooting

### Common Issues

1. **Build Failures**: Check environment variables are set correctly
2. **Database Connection**: Verify Supabase credentials
3. **Function Errors**: Check Netlify function logs
4. **CORS Issues**: Ensure proper CORS configuration

### Getting Help

1. Check the application logs in Netlify
2. Review Supabase logs for database issues
3. Test functions locally using `netlify dev`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, unique JWT secret
3. **Database Access**: Use Row Level Security (RLS) in Supabase
4. **API Keys**: Rotate keys regularly
5. **HTTPS**: Always use HTTPS in production

## Cost Optimization

1. **Supabase**: Monitor database usage and optimize queries
2. **Netlify**: Use appropriate plan for your traffic
3. **Functions**: Optimize function execution time
4. **Storage**: Clean up unused files regularly

## Next Steps

1. **Customization**: Modify the application to fit your specific needs
2. **Integration**: Connect with existing systems
3. **Scaling**: Plan for increased usage
4. **Features**: Add additional functionality as needed

---

For more detailed information, refer to the individual component documentation in the `src/` directory.








