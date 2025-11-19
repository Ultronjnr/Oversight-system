# Oversight Procurement Management System

## Production Setup Guide

### Super Admin Credentials

**Email:** `noreply@oversight.global`
**Password:** `SuperAdmin2025`

### Getting Started

1. **Database Setup**
   - Run the migration in `supabase/migrations/create_super_admin_system.sql`
   - This creates the super admin user and all necessary tables

2. **Super Admin Login**
   - Go to `/login`
   - Use the credentials above
   - Access the Super Admin Panel

3. **User Management**
   - Invite users via email from the Super Admin Panel
   - Users receive invitation links to complete their setup
   - Assign roles: Employee, HOD, Finance, Admin, SuperUser

### Features

- ✅ **Email-based user invitations** (via oversight.global domain)
- ✅ **Role-based access control**
- ✅ **Purchase requisition workflow**
- ✅ **Split transaction functionality**
- ✅ **Real-time notifications**
- ✅ **Analytics and reporting**
- ✅ **Document management**
- ✅ **Audit trails**

### User Roles

- **Employee**: Submit purchase requisitions
- **HOD**: Approve department PRs, split functionality
- **Finance**: Final approval, budget control, analytics
- **Admin**: User management, system configuration
- **SuperUser**: Full system access, user invitations

### Production Deployment

1. Set up Supabase project
2. Run database migrations
3. Configure environment variables
4. Deploy to your hosting platform
5. Configure email service for invitations

### Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Role-based permissions
- Secure invitation system with expiring tokens

### Support

For technical support or questions, contact the development team.

---

**Oversight** - Streamlining procurement processes with intelligent automation.
