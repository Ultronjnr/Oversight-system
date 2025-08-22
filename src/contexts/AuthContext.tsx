import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

// Mock users for demonstration
const mockUsers: User[] = [
  { id: '1', email: 'employee@company.com', role: 'Employee', name: 'John Mokoena', department: 'IT' },
  { id: '2', email: 'hod@company.com', role: 'HOD', name: 'Sarah Williams', department: 'IT' },
  { id: '3', email: 'finance@company.com', role: 'Finance', name: 'Michael Chen', department: 'Finance' },
  {
    id: '4',
    email: 'admin@company.com',
    role: 'Admin',
    name: 'Admin User',
    department: 'Administration',
    permissions: ['manage_users', 'send_emails', 'view_all_data', 'manage_roles']
  },
  {
    id: '5',
    email: 'superuser@company.com',
    role: 'SuperUser',
    name: 'Super Administrator',
    department: 'System',
    permissions: ['all_permissions', 'system_admin', 'manage_users', 'send_emails', 'view_all_data', 'manage_roles', 'manage_system']
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Mock login validation
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Redirect will be handled by the component using this context
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
