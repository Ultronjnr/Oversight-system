const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Public client (anon key) for general queries (no auth)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (service role) for verifying JWT and privileged ops
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

async function getUserFromAuthHeader(authorizationHeader) {
  const token = authorizationHeader?.replace('Bearer ', '');
  if (!token) return { error: 'No token provided' };
  if (!adminSupabase) return { error: 'Admin client not configured' };
  const { data, error } = await adminSupabase.auth.getUser(token);
  if (error || !data?.user) return { error: 'Invalid token' };
  return { user: data.user, token };
}

// Create a per-request client that carries the user's JWT so RLS sees auth.uid()
function getClientForToken(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

module.exports = { supabase, adminSupabase, getUserFromAuthHeader, getClientForToken };

