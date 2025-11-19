const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { getUserFromAuthHeader, getClientForToken, supabase, adminSupabase } = require('./_supabase');

// Utility: SMTP transporter
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = port === 465;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: port || 587,
    secure: !!secure,
    auth: { user, pass },
  });
}

async function sendInvitationEmail(to, password, name) {
  const transporter = getSmtpTransporter();
  if (!transporter) return { success: false, message: 'SMTP not configured' };

  const from = process.env.SMTP_FROM || `no-reply@${(process.env.FRONTEND_URL || 'oversight.local').replace(/^https?:\/\//, '')}`;

  const mailOptions = {
    from,
    to,
    subject: 'Your Oversight account has been created',
    text: `Hello ${name || ''},\n\nAn account has been created for you on Oversight.\n\nEmail: ${to}\nPassword: ${password}\n\nPlease login at ${process.env.FRONTEND_URL || 'http://localhost:4184'} and change your password immediately.\n\nRegards,\nOversight Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (e) {
    console.error('Failed to send invitation email:', e);
    return { success: false, message: e?.message || String(e) };
  }
}

async function verifyAuth(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const { user, error } = await getUserFromAuthHeader(authHeader);
  if (error) return { success: false, message: error };
  // Normalize user role
  const role = user.user_metadata?.role || user.role || 'Employee';
  return { success: true, user: { id: user.id, email: user.email, role, name: user.user_metadata?.name || user.email } };
}

module.exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    const id = pathSegments[pathSegments.length - 1];

    // Verify authentication and permissions
    const authResult = await verifyAuth(event);
    if (!authResult.success) {
      return { statusCode: 401, headers, body: JSON.stringify(authResult) };
    }

    if (!['Admin', 'SuperUser'].includes(authResult.user.role)) {
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Access denied' }) };
    }

    // Create a per-request client with the admin service role to bypass RLS
    const adminClient = adminSupabase || supabase;

    // GET /users or GET /users/:id
    if (httpMethod === 'GET') {
      if (id && id !== 'users') {
        const { data, error } = await adminClient.from('users').select('id, email, name, role, department, permissions, status, created_at, updated_at').eq('id', id).single();
        if (error) {
          return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to fetch user' }) };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
      }

      const { data, error } = await adminClient.from('users').select('id, email, name, role, department, permissions, status, created_at, updated_at');
      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to fetch users' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // POST /users -> create user
    if (httpMethod === 'POST') {
      const { email, password, name, role, department, permissions } = JSON.parse(event.body || '{}');

      if (!email || !name || !role) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing required fields' }) };
      }

      // If password not provided, generate one
      const userPassword = password || (Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4));

      // Ensure no existing user
      const { data: existing, error: existingErr } = await adminClient.from('users').select('id').eq('email', email).single();
      if (existing) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'User with this email already exists' }) };
      }

      // Create auth user via admin API
      let createdAuthUserId = null;
      try {
        if (adminClient && adminClient.auth && adminClient.auth.admin && typeof adminClient.auth.admin.createUser === 'function') {
          const { data: created, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: userPassword,
            user_metadata: { name, role, department, permissions: permissions || [] },
            email_confirm: true,
          });
          if (authError) console.warn('Auth createUser error:', authError);
          if (created?.user?.id) createdAuthUserId = created.user.id;
        } else if (adminClient && adminClient.auth && typeof adminClient.auth.createUser === 'function') {
          const { data: created, error: authError } = await adminClient.auth.createUser({
            email,
            password: userPassword,
            user_metadata: { name, role, department, permissions: permissions || [] },
          });
          if (authError) console.warn('Auth createUser error:', authError);
          if (created?.user?.id) createdAuthUserId = created.user.id;
        }
      } catch (e) {
        console.warn('Error creating auth user:', e);
      }

      // Hash password for local storage (if used)
      const passwordHash = await bcrypt.hash(userPassword, 10);

      const { data: inserted, error: insertErr } = await adminClient.from('users').insert({
        email,
        auth_user_id: createdAuthUserId,
        password_hash: passwordHash,
        name,
        role,
        department,
        permissions: permissions || [],
        status: 'Active',
      }).select('id, email, name, role, department, permissions, status, created_at, updated_at').single();

      if (insertErr) {
        console.error('Insert user record error:', insertErr);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to create user' }) };
      }

      // Try send invitation email
      let emailResult = { success: false, message: 'SMTP not configured' };
      try {
        emailResult = await sendInvitationEmail(email, userPassword, name);
      } catch (e) {
        console.warn('Email send error:', e);
      }

      return { statusCode: 201, headers, body: JSON.stringify({ success: true, data: { user: inserted, password: userPassword }, emailSent: emailResult }) };
    }

    // PUT /users/:id -> update
    if (httpMethod === 'PUT') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing user id' }) };
      const updateData = JSON.parse(event.body || '{}');
      delete updateData.password;
      delete updateData.password_hash;

      const { data, error } = await adminClient.from('users').update(updateData).eq('id', id).select('id, email, name, role, department, permissions, status, created_at, updated_at').single();
      if (error) {
        console.error('Update user error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to update user' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // DELETE /users/:id -> delete
    if (httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing user id' }) };

      // Fetch user to find auth_user_id
      const { data: existingUser } = await adminClient.from('users').select('auth_user_id').eq('id', id).single();
      const authUserId = existingUser?.auth_user_id;

      if (authUserId && adminClient && adminClient.auth && adminClient.auth.admin && typeof adminClient.auth.admin.deleteUser === 'function') {
        try {
          await adminClient.auth.admin.deleteUser(authUserId);
        } catch (e) {
          console.warn('Failed to delete auth user:', e);
        }
      }

      const { error } = await adminClient.from('users').delete().eq('id', id);
      if (error) {
        console.error('Delete user error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to delete user' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Endpoint not found' }) };
  } catch (error) {
    console.error('Users function error:', error);
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
