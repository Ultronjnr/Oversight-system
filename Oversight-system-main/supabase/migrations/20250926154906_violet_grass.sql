/*
  # Super Admin System Setup

  1. New Tables
    - Enhanced users table with auth integration
    - Invitations table for email-based user registration
    - Email templates for system communications
    - System settings for admin configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for super admin access
    - Add policies for invitation system

  3. Functions
    - Create super admin user
    - Email invitation system
    - User registration from invitations
*/

-- Create super admin user in auth.users
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Insert into auth.users (this creates the authentication record)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'superadmin@oversight.co.za',
        crypt('SuperAdmin2025!', gen_salt('bf')),
        NOW(),
        NOW(),
        '',
        NOW(),
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "SuperUser", "name": "Super Administrator", "department": "System"}',
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO admin_user_id;

    -- If user was created, also add to public.users table
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            password_hash,
            name,
            role,
            department,
            permissions,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'superadmin@oversight.co.za',
            crypt('SuperAdmin2025!', gen_salt('bf')),
            'Super Administrator',
            'SuperUser',
            'System',
            ARRAY['all_permissions', 'manage_users', 'send_emails', 'system_admin']::text[],
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- Create invitations table for email-based user registration
CREATE TABLE IF NOT EXISTS invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_type text NOT NULL CHECK (invite_type IN ('user_invite', 'collaboration_invite', 'role_invite')),
    role text,
    department text,
    pr_id uuid REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    permissions text[],
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Invitation policies
CREATE POLICY "Users can view invitations sent to them"
ON invitations FOR SELECT
USING (email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view invitations they sent"
ON invitations FOR SELECT
USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations"
ON invitations FOR INSERT
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update invitations they sent"
ON invitations FOR UPDATE
USING (invited_by = auth.uid());

CREATE POLICY "Admins can manage all invitations"
ON invitations FOR ALL
USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('Admin', 'SuperUser')
));

-- Create updated_at trigger for invitations
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    template_type text NOT NULL CHECK (template_type IN ('invitation', 'pr_approved', 'pr_declined', 'pr_split', 'reminder', 'general')),
    variables jsonb DEFAULT '{}',
    is_system boolean DEFAULT false,
    created_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Email template policies
CREATE POLICY "Admins can manage email templates"
ON email_templates FOR ALL
USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('Admin', 'SuperUser')
));

CREATE POLICY "Users can view email templates"
ON email_templates FOR SELECT
USING (true);

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, template_type, is_system, variables) VALUES
(
    'User Invitation',
    'Welcome to Oversight - Complete Your Account Setup',
    'Dear {USER_NAME},

You have been invited to join the Oversight Procurement Management System as a {ROLE}.

To complete your account setup, please click the link below:
{INVITATION_LINK}

This invitation will expire on {EXPIRY_DATE}.

Your role: {ROLE}
Department: {DEPARTMENT}

If you have any questions, please contact your administrator.

Best regards,
The Oversight Team',
    'invitation',
    true,
    '{"USER_NAME": "string", "ROLE": "string", "DEPARTMENT": "string", "INVITATION_LINK": "string", "EXPIRY_DATE": "string"}'::jsonb
),
(
    'Purchase Requisition Approved',
    'Purchase Requisition Approved - {TRANSACTION_ID}',
    'Dear {EMPLOYEE_NAME},

Your purchase requisition has been approved.

Transaction ID: {TRANSACTION_ID}
Total Amount: {AMOUNT}
Approved by: {APPROVER_NAME}
Expected delivery: {DELIVERY_DATE}

You can track the progress in your dashboard.

Thank you.',
    'pr_approved',
    true,
    '{"EMPLOYEE_NAME": "string", "TRANSACTION_ID": "string", "AMOUNT": "string", "APPROVER_NAME": "string", "DELIVERY_DATE": "string"}'::jsonb
),
(
    'Purchase Requisition Declined',
    'Purchase Requisition Update - {TRANSACTION_ID}',
    'Dear {EMPLOYEE_NAME},

We regret to inform you that your purchase requisition has been declined.

Transaction ID: {TRANSACTION_ID}
Reason: {DECLINE_REASON}
Alternative suggestions: {ALTERNATIVES}

Please contact your supervisor for more information.

Best regards,
The Oversight Team',
    'pr_declined',
    true,
    '{"EMPLOYEE_NAME": "string", "TRANSACTION_ID": "string", "DECLINE_REASON": "string", "ALTERNATIVES": "string"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value jsonb NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    updated_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- System settings policies
CREATE POLICY "Admins can manage system settings"
ON system_settings FOR ALL
USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('Admin', 'SuperUser')
));

CREATE POLICY "Users can view public settings"
ON system_settings FOR SELECT
USING (is_public = true);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('smtp_config', '{"host": "", "port": 587, "user": "", "password": "", "from": "noreply@oversight.co.za"}', 'SMTP configuration for email sending', false),
('app_config', '{"name": "Oversight", "version": "1.0.0", "maintenance_mode": false}', 'Application configuration', true),
('feature_flags', '{"split_prs": true, "email_notifications": true, "audit_logs": true}', 'Feature toggles', false),
('security_config', '{"session_timeout": 3600, "password_policy": "strong", "mfa_required": false}', 'Security settings', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Function to handle user registration from invitation
CREATE OR REPLACE FUNCTION handle_invitation_signup()
RETURNS trigger AS $$
BEGIN
    -- When a user signs up via invitation, update their metadata
    IF NEW.raw_user_meta_data ? 'invitation_token' THEN
        -- Find the invitation
        UPDATE invitations 
        SET status = 'accepted', updated_at = now()
        WHERE token = (NEW.raw_user_meta_data->>'invitation_token')
        AND status = 'pending'
        AND expires_at > now();
        
        -- Create user record in public.users
        INSERT INTO public.users (
            id,
            email,
            password_hash,
            name,
            role,
            department,
            permissions,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            '', -- Password handled by auth
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Employee'),
            COALESCE(NEW.raw_user_meta_data->>'department', ''),
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permissions')),
                ARRAY[]::text[]
            ),
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            permissions = EXCLUDED.permissions,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invitation signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_invitation_signup();