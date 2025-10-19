import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, UserPlus, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ProfessionalLoader from '../components/ProfessionalLoader';

const InviteSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      verifyInvitation();
    } else {
      toast({
        title: 'Invalid Invitation',
        description: 'This invitation link is invalid or expired.',
        variant: 'destructive'
      });
      navigate('/login');
    }
  }, [token, email]);

  const verifyInvitation = async () => {
    try {
      console.log('🔍 Verifying invitation:', { token, email });

      // Query invitations table directly with service role key
      // If RLS is enabled, use unauthenticated user's perspective
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', now)
        .single();

      console.log('📋 Invitation query result:', { data, error });

      if (error) {
        console.error('❌ Query error:', error.message, error.code);

        // If RLS is blocking, try to give a better error message
        if (error.code === 'PGRST116') {
          console.error('Invitation not found with token/email/status criteria');
        } else if (error.message.includes('row level security')) {
          console.error('RLS policy is blocking the query - this should be allowed for public invites');
        }

        toast({
          title: 'Invalid Invitation',
          description: 'This invitation link is invalid or has expired.',
          variant: 'destructive'
        });
        navigate('/login');
        return;
      }

      if (!data) {
        console.error('❌ No invitation found');
        toast({
          title: 'Invalid Invitation',
          description: 'This invitation link is invalid or has expired.',
          variant: 'destructive'
        });
        navigate('/login');
        return;
      }

      console.log('✅ Invitation verified:', {
        id: data.id,
        email: data.email,
        role: data.role,
        department: data.department,
        status: data.status,
        expires_at: data.expires_at
      });

      setInvitation(data);
    } catch (error: any) {
      console.error('❌ Error verifying invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify invitation. Please try again.',
        variant: 'destructive'
      });
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your full name.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please ensure both passwords match.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: invitation.role,
            department: invitation.department,
            permissions: invitation.permissions || [],
            invitation_token: token
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // If a session is issued immediately (email confirmation disabled), create profile row
      if (authData.session?.user) {
        const { error: profileErr } = await supabase
          .from('users')
          .insert({
            id: authData.session.user.id,
            email: invitation.email,
            role: invitation.role,
            name: formData.name,
            department: invitation.department || null,
            permissions: invitation.permissions || []
          })
          .select('id')
          .single();
        // Non-fatal if this fails; RLS requires session which may not exist when email confirmation is on
        if (profileErr) {
          console.warn('Profile insert skipped or failed (likely no session yet):', profileErr.message);
        }
      }

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      setShowLoader(true);

      // Show success and redirect
      setTimeout(() => {
        toast({
          title: 'Account Created Successfully',
          description: 'Welcome to Oversight! You can now log in with your credentials.',
        });
        navigate('/login');
        setShowLoader(false);
      }, 3200);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <ProfessionalLoader isVisible={showLoader} type="login" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-20 w-24 h-24 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Signup Card */}
        <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-lg border-0 shadow-2xl shadow-blue-500/10 animate-fade-in">
          <CardHeader className="text-center pb-8">
            {/* Logo with Premium Animation */}
            <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-fit shadow-lg shadow-green-500/25 transform hover:scale-110 transition-all duration-300">
              <UserPlus className="h-8 w-8 text-white" />
            </div>

            {/* Animated Title */}
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Complete Setup
            </CardTitle>

            <CardDescription className="text-gray-600">
              You've been invited to join Oversight as a <strong>{invitation.role}</strong>
              {invitation.department && <span> in the <strong>{invitation.department}</strong> department</span>}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="pl-10 h-12 border-gray-200 bg-gray-50 rounded-xl"
                  />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-12 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-green-50 rounded-lg transition-all duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-12 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-green-50 rounded-lg transition-all duration-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>

            {/* Invitation Details */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-semibold text-gray-700">Invitation Details</p>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium">Role:</span>
                  <span className="text-green-600 font-medium">{invitation.role}</span>
                </div>
                {invitation.department && (
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium">Department:</span>
                    <span className="text-green-600 font-medium">{invitation.department}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium">Expires:</span>
                  <span className="text-green-600 font-medium">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InviteSignup;
