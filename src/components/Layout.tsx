import React from 'react';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, FileText, History, Bell, Shield, Settings } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    const links = [];

    switch (user?.role) {
      case 'Employee':
        links.push({ href: '/employee/portal', label: 'My Portal', icon: User });
        break;
      case 'HOD':
        links.push({ href: '/hod/portal', label: 'HOD Portal', icon: User });
        break;
      case 'Finance':
        links.push({ href: '/finance/portal', label: 'Finance Portal', icon: User });
        break;
      case 'Admin':
        links.push({ href: '/admin/portal', label: 'Admin Portal', icon: Shield });
        break;
      case 'SuperUser':
        links.push({ href: '/super-admin', label: 'Super Admin', icon: Settings });
        break;
    }

    links.push({ href: '/quotes/history', label: 'Purchase Requisition History', icon: History });

    // Add admin portal access for admin users
    if ((user?.role === 'Admin' || user?.role === 'SuperUser') && !links.some(link => link.href.includes('portal'))) {
      links.unshift({ href: '/admin/portal', label: 'Admin Portal', icon: Shield });
    }

    return links;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Premium Header with Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100/50 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              {/* Logo with Animation */}
              <div className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Oversight
                </h1>
              </div>
              
              {/* Navigation with Hover Effects */}
              <nav className="hidden md:flex space-x-1">
                {getNavLinks().map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile Card */}
              <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-xl px-3 py-2 border border-blue-100/50">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-blue-600">{user?.role}</div>
                </div>
              </div>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Animation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title with Gradient */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-2">
            {title}
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </div>
        
        {/* Content Container with Glass Effect */}
        <div className="animate-slide-up">
          {children}
        </div>
      </main>

      {/* Floating Elements for Visual Appeal */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-24 h-24 bg-indigo-200/20 rounded-full blur-3xl animate-pulse pointer-events-none delay-1000"></div>
    </div>
  );
};

export default Layout;
