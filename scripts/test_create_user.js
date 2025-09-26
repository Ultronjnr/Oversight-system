(async () => {
  try {
    const supabasePkg = await import('@supabase/supabase-js');
    const { createClient } = supabasePkg;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error('Missing SUPABASE envs');
      process.exit(1);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const publicClient = createClient(supabaseUrl, anonKey);

    const adminEmail = 'local-superadmin@example.com';
    const adminPassword = 'TestPass123!';

    // Try create admin user
    try {
      if (admin.auth && admin.auth.admin && typeof admin.auth.admin.createUser === 'function') {
        const { data, error } = await admin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          user_metadata: { name: 'Local Super Admin', role: 'SuperUser' },
          email_confirm: true,
        });
        if (error) {
          console.warn('Could not create admin user via admin.createUser:', error.message || error);
        } else {
          console.log('Admin user created:', data.user?.id);
        }
      } else {
        console.warn('Admin createUser not available on this client');
      }
    } catch (e) {
      console.warn('Create admin user error (may already exist):', e.message || e);
    }

    // Sign in as admin to get token
    const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (signInError) {
      console.error('Admin sign-in failed:', signInError.message || signInError);
      process.exit(1);
    }
    const token = signInData.session?.access_token;
    if (!token) {
      console.error('No token returned for admin');
      process.exit(1);
    }
    console.log('Got admin token');

    // Create a new test user via invoking Netlify function handler directly
    const newUser = {
      email: `test.user.${Date.now()}@example.com`,
      name: 'Test User',
      role: 'Employee'
    };

    // Load the local Netlify function module (CommonJS) using createRequire
    const modulePkg = await import('module');
    const { createRequire } = modulePkg;
    const require = createRequire(import.meta.url);
    const usersModule = require('../netlify/functions/users.js');
    if (!usersModule || !usersModule.handler) {
      console.error('Users function handler not found');
      process.exit(1);
    }

    const event = {
      httpMethod: 'POST',
      path: '/.netlify/functions/users',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newUser),
    };

    // Invoke the CJS wrapper via child_process to call the Netlify function
    const cp = await import('child_process');
    const payload = JSON.stringify(event);
    const child = cp.spawnSync('node', ['scripts/run_users_function.cjs', payload], { encoding: 'utf-8' });
    if (child.error) {
      console.error('Failed to run users function wrapper:', child.error);
      process.exit(1);
    }
    const out = child.stdout.trim();
    if (!out) {
      console.error('Users function produced no output. Stderr:', child.stderr);
      process.exit(1);
    }
    const parsed = JSON.parse(out);
    console.log('Create user function response:', parsed.body);
  } catch (e) {
    console.error('Test script error:', e);
    process.exit(1);
  }
})();
