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
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sUser = data.session?.user;
        if (sUser) {
          // Get user details from public.users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sUser.id)
            .single();

          if (userData && !userError) {
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
      setIsLoading(false);
    };
    init();

    try {
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const sUser = session?.user;
        if (sUser) {
          // Get user details from public.users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sUser.id)
            .single();

          if (userData && !userError) {
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
        setIsLoading(false);
        return { success: false, message: error.message || String(error) };
      }

      const sUser = data.user;
      if (!sUser) {
        setIsLoading(false);
        return { success: false, message: 'Authentication failed' };
      }

      // Get user details from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sUser.id)
        .single();

      if (userData && !userError) {
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
      } else {
        setIsLoading(false);
        return { success: false, message: 'User profile not found' };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
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
