import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL || (process.env as any).REACT_APP_SUPABASE_URL;
const supabaseAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process.env as any).VITE_SUPABASE_ANON_KEY || (process.env as any).REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
    // In dev without envs, we avoid throwing to keep mock working
    // eslint-disable-next-line no-console
    console.warn('Supabase env vars missing. Auth will fallback to mock if implemented.');
    console.warn('Available env vars:', {
        VITE_SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL,
        REACT_APP_SUPABASE_URL: (process.env as any).REACT_APP_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY,
        REACT_APP_SUPABASE_ANON_KEY: (process.env as any).REACT_APP_SUPABASE_ANON_KEY,
    });
}

// Only create client if we have valid credentials
let supabase;
if (supabaseUrl && supabaseAnon) {
    supabase = createClient(supabaseUrl, supabaseAnon, {
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








