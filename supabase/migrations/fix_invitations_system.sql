-- Fix Invitations System
-- This migration fixes the invitation workflow to properly handle user registration

-- 1. Make invited_by optional (allow invitations without a specific user reference)
ALTER TABLE invitations ALTER COLUMN invited_by DROP NOT NULL;

-- 2. Add status column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'suspended'));

-- 3. Ensure profile_completed column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status);
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON invitations(email, status);

-- 5. Drop old restrictive policies and create more permissive ones
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Users can update invitations they sent" ON invitations;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON invitations;

-- 6. Create new RLS policies that allow public access to pending invitations
-- Allow anyone to SELECT pending, non-expired invitations (for verification)
CREATE POLICY "Public can view pending invitations for verification"
ON invitations FOR SELECT
USING (status = 'pending' AND expires_at > now());

-- Allow authenticated users to create invitations
CREATE POLICY "Authenticated users can create invitations"
ON invitations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their role/super admin invitations
CREATE POLICY "Authenticated users can update invitations"
ON invitations FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 7. Create or replace trigger function to handle user status updates
CREATE OR REPLACE FUNCTION update_user_status_on_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- When an invitation is accepted, update the corresponding user's status to active
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        UPDATE users
        SET status = 'active', profile_completed = true, updated_at = now()
        WHERE email ILIKE NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger on invitations table
DROP TRIGGER IF EXISTS on_invitation_accepted ON invitations;
CREATE TRIGGER on_invitation_accepted
    AFTER UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status_on_invitation_accepted();

-- 9. Update the handle_invitation_signup function to properly handle status
CREATE OR REPLACE FUNCTION handle_invitation_signup()
RETURNS trigger AS $$
BEGIN
    -- When a user signs up via invitation, update their metadata and mark profile as complete
    IF NEW.raw_user_meta_data ? 'invitation_token' THEN
        -- Find the invitation and mark as accepted
        UPDATE invitations 
        SET status = 'accepted', updated_at = now()
        WHERE token = (NEW.raw_user_meta_data->>'invitation_token')
        AND status = 'pending'
        AND expires_at > now();
        
        -- Create or update user record in public.users
        INSERT INTO public.users (
            id,
            email,
            password_hash,
            name,
            role,
            department,
            permissions,
            status,
            profile_completed,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            LOWER(NEW.email),
            '', -- Password handled by auth
            COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Employee'),
            COALESCE(NEW.raw_user_meta_data->>'department', ''),
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'permissions')),
                ARRAY[]::text[]
            ),
            'active',
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            permissions = EXCLUDED.permissions,
            status = 'active',
            profile_completed = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_invitation_signup();

-- 11. Update users RLS policies to allow reading of profile_completed status
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('Admin', 'SuperUser')
));

-- 12. Verify all indexes are in place
CREATE INDEX IF NOT EXISTS idx_invitations_email_token ON invitations(email, token);
CREATE INDEX IF NOT EXISTS idx_invitations_status_expires ON invitations(status, expires_at);

-- 13. Add comment for documentation
COMMENT ON COLUMN users.status IS 'User status: active, pending (awaiting profile completion), inactive, or suspended';
COMMENT ON COLUMN users.profile_completed IS 'Flag indicating if user has completed their profile setup via invitation';
