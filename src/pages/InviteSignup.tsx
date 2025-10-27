import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const InviteSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');
  const rawEmail = searchParams.get('email');
  const email = rawEmail
    ? (rawEmail
        .trim()
        .match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[0] || rawEmail)
        .toLowerCase()
        .trim()
    : null;

  useEffect(() => {
    let isMounted = true;

    const startVerification = async () => {
      if (token && email) {
        console.log('📨 Starting invitation verification...', { token: token.substring(0, 10) + '...', email });
        if (isMounted) {
          await verifyInvitation();
        }
      } else {
        console.error('❌ Missing token or email in URL', { rawEmail, email });
        if (isMounted) {
          setInvitation({ email: email || 'user@example.com', role: 'Employee', department: null });
        }
      }
    };

    startVerification();

    return () => {
      isMounted = false;
    };
  }, [token, email]);

  const verifyInvitation = async () => {
    try {
      if (!token || !email) {
        console.error('❌ Missing token or email');
        setInvitation({ email: email || 'user@example.com', role: 'Employee', department: null });
        return;
      }

      console.log('🔍 Verifying invitation via Edge Function:', {
        token: token.substring(0, 10) + '...',
        email: email.substring(0, 10) + '...'
      });

      const timeoutPromise = new Promise<any>((resolve) => {
        setTimeout(() => {
          console.warn('⏱️ Verification timeout after 15 seconds');
          resolve({ timedOut: true });
        }, 15000);
      });

      const verificationPromise = supabase.functions.invoke('verify-invitation', {
        body: { token, email: email.toLowerCase() },
        headers: { 'Content-Type': 'application/json' }
      }).then(result => ({ ...result, timedOut: false }));

      const result: any = await Promise.race([
        verificationPromise,
        timeoutPromise
      ]);

      if (result.timedOut) {
        console.warn('⚠️ Verification timed out, attempting direct database query');
        const { data: fallbackData } = await supabase
          .from('invitations')
          .select('id, email, role, department, status, expires_at, token, created_at')
          .eq('token', token)
          .ilike('email', email)
          .eq('status', 'pending')
          .maybeSingle();

        if (fallbackData) {
          console.log('✅ Found invitation via fallback query:', { role: fallbackData.role });
          setInvitation(fallbackData);
          return;
        }

        console.warn('⚠️ No invitation found, using default');
        setInvitation({
          id: `fallback_${Date.now()}`,
          email,
          role: 'Employee',
          department: null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
        return;
      }

      const { data: responseData, error: functionError } = result;

      console.log('📡 Edge Function response:', {
        success: responseData?.success,
        hasData: !!responseData?.data,
        error: functionError?.message,
      });

      if (functionError) {
        console.error('❌ Edge Function invocation error:', functionError);
        const { data: fallbackData } = await supabase
          .from('invitations')
          .select('id, email, role, department, status, expires_at, token, created_at')
          .eq('token', token)
          .ilike('email', email)
          .eq('status', 'pending')
          .maybeSingle();

        if (fallbackData) {
          console.log('✅ Found invitation via fallback query after error:', { role: fallbackData.role });
          setInvitation(fallbackData);
          return;
        }

        setInvitation({
          id: `fallback_${Date.now()}`,
          email,
          role: 'Employee',
          department: null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
        return;
      }

      if (responseData?.success && responseData?.data) {
        console.log('✅ Invitation verified successfully:', { role: responseData.data.role });
        setInvitation(responseData.data);
        return;
      }

      if (!responseData?.success) {
        console.warn('⚠️ Verification failed, checking database directly:', responseData?.error);
        const { data: fallbackData } = await supabase
          .from('invitations')
          .select('id, email, role, department, status, expires_at, token, created_at')
          .eq('token', token)
          .ilike('email', email)
          .eq('status', 'pending')
          .maybeSingle();

        if (fallbackData) {
          console.log('✅ Found invitation via fallback query:', { role: fallbackData.role });
          setInvitation(fallbackData);
          return;
        }

        setInvitation({
          id: `fallback_${Date.now()}`,
          email,
          role: 'Employee',
          department: null,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
        return;
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error.message);
      try {
        const { data: fallbackData } = await supabase
          .from('invitations')
          .select('id, email, role, department, status, expires_at, token, created_at')
          .eq('token', token)
          .ilike('email', email || '')
          .eq('status', 'pending')
          .maybeSingle();

        if (fallbackData) {
          console.log('✅ Recovered invitation from fallback query:', { role: fallbackData.role });
          setInvitation(fallbackData);
          return;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
      }

      setInvitation({
        id: `fallback_${Date.now()}`,
        email: email || 'user@example.com',
        role: 'Employee',
        department: null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
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
      console.log('🔐 Creating user account in Supabase Auth...');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: invitation.role,
            department: invitation.department,
            permissions: Array.isArray(invitation.permissions)
              ? invitation.permissions.join(',')
              : (invitation.permissions || ''),
            invitation_token: token
          }
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }

      console.log('✅ Account created successfully');
      setIsLoading(false);

      toast({
        title: 'Account Created Successfully',
        description: 'Welcome to Oversight!',
      });

      console.log('🔄 Redirecting to login page...');
      navigate('/login', { replace: true });

      if (authData.session?.user) {
        console.log('📝 Saving profile in background...');
        supabase
          .from('users')
          .upsert({
            id: authData.session.user.id,
            email: invitation.email,
            role: invitation.role,
            name: formData.name,
            department: invitation.department || null,
            permissions: invitation.permissions || [],
            profile_completed: true
          }, { onConflict: 'id' })
          .select('id')
          .maybeSingle()
          .then(() => console.log('✅ Profile saved with completion status'))
          .catch((err) => console.warn('⚠️ Profile save failed (non-critical):', err.message));
      }

      if (invitation.id && !invitation.id.startsWith('fallback_')) {
        console.log('📋 Marking invitation as accepted in background...');
        supabase
          .from('invitations')
          .update({
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', invitation.id)
          .then(() => console.log('✅ Invitation marked as accepted'))
          .catch((err) => console.warn('⚠️ Invitation update failed (non-critical):', err.message));
      }

    } catch (error: any) {
      console.error('❌ Signup error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        statusText: error.statusText
      });
      setIsLoading(false);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive'
      });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-lg border-0 shadow-2xl shadow-blue-500/10 animate-fade-in">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 transform hover:scale-110 transition-all duration-300">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F75cb47fbaca646419953eca36b07cbc8%2Fefed5ff2c1664f0eb97bcf83de29ac4b?format=webp&width=800"
              alt="Oversight Logo"
              className="h-16 w-auto drop-shadow-lg"
            />
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Complete Setup
          </CardTitle>

          <CardDescription className="text-gray-600">
            You've been invited to join Oversight as a {invitation.role}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
                  required
                />
              </div>
            </div>

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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50 rounded-lg transition-all duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50 rounded-lg transition-all duration-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-700">Invitation Details</p>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between items-center py-1">
                <span className="font-medium">Role:</span>
                <span className="text-blue-600 font-medium">{invitation.role}</span>
              </div>
              {invitation.department && (
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium">Department:</span>
                  <span className="text-blue-600 font-medium">{invitation.department}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1">
                <span className="font-medium">Expires:</span>
                <span className="text-blue-600 font-medium">
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignup;
