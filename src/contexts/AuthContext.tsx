import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  email: string;
  role: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  name: string;
  department?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const sUser = data.session?.user;
        if (sUser) {
          // Get user details from public.users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sUser.id)
            .maybeSingle();

          if (mounted && userData && !userError) {
            const normalized: User = {
              id: userData.id,
              email: userData.email,
              role: userData.role as User['role'],
              name: userData.name,
              department: userData.department,
              permissions: userData.permissions || [],
            };
            setUser(normalized);
            localStorage.setItem('user', JSON.stringify(normalized));
          }
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
      }
      if (mounted) setIsLoading(false);
    };

    init();

    // Set up auth state change listener
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;

        const sUser = session?.user;
        if (sUser) {
          try {
            // Get user details from public.users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', sUser.id)
              .maybeSingle();

            if (mounted && userData && !userError) {
              const normalized: User = {
                id: userData.id,
                email: userData.email,
                role: userData.role as User['role'],
                name: userData.name,
                department: userData.department,
                permissions: userData.permissions || [],
              };
              setUser(normalized);
              localStorage.setItem('user', JSON.stringify(normalized));
            }
          } catch (userError) {
            console.warn('Error fetching user details:', userError);
          }
        } else {
          if (mounted) {
            setUser(null);
            localStorage.removeItem('user');
          }
        }
      });
      unsubscribe = data.subscription?.unsubscribe || null;
    } catch (error) {
      console.warn('Auth state change subscription error:', error);
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          console.warn('Unsubscribe error:', e);
        }
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        console.error('❌ Sign in error:', error);
        return { success: false, message: error.message || String(error) };
      }

      const sUser = data.user;
      if (!sUser) {
        setIsLoading(false);
        return { success: false, message: 'Authentication failed' };
      }

      console.log('✅ Auth successful, fetching user profile...');

      // Get user details from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .maybeSingle();

      if (userData && !userError) {
        console.log('✅ User profile found:', { id: userData.id, role: userData.role });
        const normalized: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role as User['role'],
          name: userData.name,
          department: userData.department,
          permissions: userData.permissions || [],
        };
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        setIsLoading(false);
        return { success: true };
      } else {
        console.warn('⚠️ User profile query failed:', {
          userError: userError?.message || userError?.code,
          userId: sUser.id,
          email: sUser.email,
          userErrorDetails: userError
        });

        // Fallback: create a minimal user object from auth data
        // This allows login to succeed even if profile query fails due to RLS
        const fallbackUser: User = {
          id: sUser.id,
          email: sUser.email || email,
          role: (sUser.user_metadata?.role as User['role']) || 'Employee',
          name: sUser.user_metadata?.name || sUser.email?.split('@')[0] || 'User',
          department: sUser.user_metadata?.department,
          permissions: sUser.user_metadata?.permissions || [],
        };

        console.log('⚠️ Using fallback user object:', fallbackUser);
        setUser(fallbackUser);
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        setIsLoading(false);

        // Still succeed the login, but log the issue for debugging
        return { success: true, message: 'Logged in (using fallback profile)' };
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('❌ Login error:', err);
      return { success: false, message: err?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      // Clear state immediately
      setUser(null);
      setIsLoading(false);
      localStorage.removeItem('user');
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Force redirect to login with full page reload
      window.location.href = '/login';
    } catch (error) {
      console.warn('Logout error:', error);
      // Even if signOut fails, redirect to login
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
