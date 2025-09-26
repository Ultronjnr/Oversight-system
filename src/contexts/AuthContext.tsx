import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Supabase-only auth. No mock fallback.

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Handle Supabase hash-based tokens (invite/recovery/magic link)
        if (typeof window !== 'undefined' && window.location.hash?.includes('access_token')) {
          const hash = window.location.hash.replace(/^#/, '');
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token') || undefined;
          const refresh_token = params.get('refresh_token') || undefined;
          if (access_token && refresh_token && (supabase as any)?.auth?.setSession) {
            try {
              await (supabase as any).auth.setSession({ access_token, refresh_token });
              // Clean the hash from the URL without reloading
              const { pathname, search } = window.location;
              const cleanUrl = pathname + (search || '');
              window.history.replaceState({}, document.title, cleanUrl);
            } catch (e) {
              console.warn('Failed to set Supabase session from hash:', e);
            }
          }
        }

        const { data } = await supabase.auth.getSession();
        const sUser = data.session?.user;
        if (sUser) {
          const normalized: User = {
            id: sUser.id,
            email: sUser.email || '',
            role: (sUser.user_metadata?.role as User['role']) || 'Employee',
            name: (sUser.user_metadata?.name as string) || (sUser.email ?? 'User'),
            department: sUser.user_metadata?.department,
            permissions: sUser.user_metadata?.permissions || [],
          };
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        } else {
          const storedUser = localStorage.getItem('user');
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Auth initialization error:', error);
        // Fallback to stored user
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    init();

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const sUser = session?.user;
        if (sUser) {
          const normalized: User = {
            id: sUser.id,
            email: sUser.email || '',
            role: (sUser.user_metadata?.role as User['role']) || 'Employee',
            name: (sUser.user_metadata?.name as string) || (sUser.email ?? 'User'),
            department: sUser.user_metadata?.department,
            permissions: sUser.user_metadata?.permissions || [],
          };
          setUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      });
      return () => sub.subscription.unsubscribe();
    } catch (error) {
      console.warn('Auth state change subscription error:', error);
      return () => { }; // Return empty cleanup function
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn('Login error:', error);
        setIsLoading(false);
        return { success: false, message: error.message || String(error) };
      }

      const sUser = data.user;
      if (!sUser) {
        console.warn('No user in session');
        setIsLoading(false);
        return {
          success: false,
          message:
            'No user returned from Supabase. This may indicate the account was created without a password (invite) — ask an admin to resend an invite or use password reset.',
        };
      }

      const normalized: User = {
        id: sUser.id,
        email: sUser.email || email,
        role: (sUser.user_metadata?.role as User['role']) || 'Employee',
        name: (sUser.user_metadata?.name as string) || (sUser.email ?? 'User'),
        department: sUser.user_metadata?.department,
        permissions: sUser.user_metadata?.permissions || [],
      };
      setUser(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.warn('Login exception:', err);
      setIsLoading(false);
      return { success: false, message: err?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout error:', error);
    }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
