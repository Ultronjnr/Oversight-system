import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  try {
    // Vite exposes import.meta.env in the browser during dev/build
    const v = (import.meta as any)?.env?.[key];
    if (v) return v;
  } catch (e) {
    // ignore
  }

  // Guard access to process for environments where it's not defined (browsers)
  if (typeof process !== 'undefined' && (process as any)?.env) {
    return (process as any).env[key];
  }

  return undefined;
};

const supabaseUrl =
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('REACT_APP_SUPABASE_URL');
const supabaseAnon =
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Debug: log presence (booleans) of env keys without revealing secret values
try {
  // eslint-disable-next-line no-console
  console.log('Supabase env presence:', {
    VITE_SUPABASE_URL: !!getEnv('VITE_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_URL: !!getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    REACT_APP_SUPABASE_URL: !!getEnv('REACT_APP_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: !!getEnv('VITE_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    REACT_APP_SUPABASE_ANON_KEY: !!getEnv('REACT_APP_SUPABASE_ANON_KEY'),
    processEnvPresent: typeof process !== 'undefined' && !!(process as any).env,
  });
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Error while logging env presence:', e);
}

if (!supabaseUrl || !supabaseAnon) {
  // In dev without envs, we avoid throwing to keep mock working
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars missing. Auth will fallback to mock if implemented.');
  console.warn('Env var presence:', {
    VITE_SUPABASE_URL: !!getEnv('VITE_SUPABASE_URL'),
    REACT_APP_SUPABASE_URL: !!getEnv('REACT_APP_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: !!getEnv('VITE_SUPABASE_ANON_KEY'),
    REACT_APP_SUPABASE_ANON_KEY: !!getEnv('REACT_APP_SUPABASE_ANON_KEY'),
  });
}

// Development-only fallback: if Vite env vars are not injected, optionally use local fallback for debugging
let supabase: any;
const isDev = (import.meta as any).env?.MODE === 'development';

let finalUrl = supabaseUrl;
let finalAnon = supabaseAnon;

if ((!finalUrl || !finalAnon) && isDev) {
  // WARNING: These are development fallbacks only. Do NOT commit production secrets.
  // Using the known demo project credentials from env.example for local testing.
  finalUrl = finalUrl || 'https://erpjzgxxcgozqzmjubtw.supabase.co';
  finalAnon = finalAnon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycGp6Z3h4Y2dvenF6bWp1YnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzYxOTgsImV4cCI6MjA3NDExMjE5OH0._6HKXe2D0aEtGUnjqWLgjTeKewCLMhJmMwHBtidYh9A';
  // eslint-disable-next-line no-console
  console.warn('Using development fallback Supabase credentials for local debugging. Remove before production.');
}

if (finalUrl && finalAnon) {
  supabase = createClient(finalUrl, finalAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // Create a mock client for development
  console.warn('Creating mock Supabase client - authentication will not work');
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
  };
}

export { supabase };
export default supabase;
