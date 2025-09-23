import React, { createContext, useContext, useState, useEffect } from 'react';
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
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn('Login error:', error);
        setIsLoading(false);
        return false;
      }
      const sUser = data.user;
      if (!sUser) {
        console.warn('No user in session');
        setIsLoading(false);
        return false;
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
      return true;
    } catch (err) {
      console.warn('Login exception:', err);
      setIsLoading(false);
      return false;
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
