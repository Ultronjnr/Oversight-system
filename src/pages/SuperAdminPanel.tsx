import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Mail, 
  Settings, 
  Shield, 
  Send, 
  UserPlus, 
  Eye, 
  Trash2, 
  Building, 
  BarChart3,
  FileText,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { ApiService } from '../services/apiService';

interface User {
  id: string;
  email: string;
  role: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  name: string;
  department?: string;
  permissions?: string[];
  status: 'Active' | 'Inactive' | 'Suspended' | 'Invited';
  lastLogin?: Date;
  createdAt: Date;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'pr_approved' | 'pr_declined' | 'pr_split' | 'general' | 'reminder';
}

interface SystemStats {
  totalUsers: number;
  activePRs: number;
  totalPRValue: number;
  pendingApprovals: number;
  monthlyPRs: number;
  approvalRate: number;
}

const SuperAdminPanel = () => {
  const { user } = useAuth();
  const { canManageUsers, canSendEmails, canManageSystem, userRole } = useRoleBasedAccess();
  const [users, setUsers] = useState<User[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activePRs: 0,
    totalPRValue: 0,
    pendingApprovals: 0,
    monthlyPRs: 0,
    approvalRate: 0
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    smtp: { host: '', port: 587, user: '', pass: '' },
    features: { splitPRs: true, reminders: true, notifications: true },
    integrations: { supabaseUrl: '', supabaseKey: '' }
  });
  
  // Invite User Form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Employee' as User['role'],
    department: '',
    inviterEmail: user?.email || ''
  });

  // Email Form
  const [emailForm, setEmailForm] = useState({
    recipients: [] as string[],
    subject: '',
    body: '',
    template: ''
  });

  // Template Form
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    subject: '',
    body: '',
    type: 'general' as EmailTemplate['type']
  });

  useEffect(() => {
    if (canManageUsers()) {
      loadUsers();
      loadEmailTemplates();
      loadSystemStats();
      loadSettings();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const normalized = usersData.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.department || '',
        permissions: u.permissions || [],
        status: 'Active', // Default status
        createdAt: new Date(u.created_at)
      }));

      // Also load pending invitations
      const { data: invitationsData } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      const invitedUsers = (invitationsData || []).map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        name: `${inv.email.split('@')[0]} (Invited)`,
        role: inv.role,
        department: inv.department || '',
        permissions: inv.permissions || [],
        status: 'Invited' as User['status'],
        createdAt: new Date(inv.created_at)
      }));

      setUsers([...normalized, ...invitedUsers]);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error Loading Users',
        description: 'Failed to load user data. Please refresh the page.',
        variant: 'destructive'
      });
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const normalized = templatesData.map((t: any) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        type: t.template_type
      }));

      setEmailTemplates(normalized);
    } catch (error) {
      console.warn('Failed to load email templates from database, using defaults');
      // Use default templates
      setEmailTemplates([
        {
          id: '1',
          name: 'User Invitation',
          subject: 'Welcome to Oversight - Complete Your Account Setup',
          body: 'You have been invited to join Oversight...',
          type: 'invitation'
        }
      ]);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Load from Supabase
      const { data: prsData } = await supabase
        .from('purchase_requisitions')
        .select('*');

      const { data: usersData } = await supabase
        .from('users')
        .select('id');

      const prs = prsData || [];
      const currentMonth = new Date().getMonth();
      const monthlyPRs = prs.filter((pr: any) => new Date(pr.created_at).getMonth() === currentMonth);
      const approvedPRs = prs.filter((pr: any) => pr.finance_status === 'Approved');
      const pendingPRs = prs.filter((pr: any) => pr.hod_status === 'Pending' || pr.finance_status === 'Pending');
      const totalValue = prs.reduce((sum: number, pr: any) => sum + (parseFloat(pr.total_amount) || 0), 0);

      setSystemStats({
        totalUsers: (usersData?.length || 0) + 1,
        activePRs: prs.length,
        totalPRValue: totalValue,
        pendingApprovals: pendingPRs.length,
        monthlyPRs: monthlyPRs.length,
        approvalRate: prs.length > 0 ? (approvedPRs.length / prs.length) * 100 : 0
      });
    } catch (error) {
      console.warn('Failed to load from Supabase, using localStorage fallback');
      const savedPRs = localStorage.getItem('purchaseRequisitions');
      const prs = savedPRs ? JSON.parse(savedPRs) : [];
      const currentMonth = new Date().getMonth();
      const monthlyPRs = prs.filter((pr: any) => new Date(pr.requestDate).getMonth() === currentMonth);
      const approvedPRs = prs.filter((pr: any) => pr.financeStatus === 'Approved');
      const pendingPRs = prs.filter((pr: any) => pr.hodStatus === 'Pending' || pr.financeStatus === 'Pending');
      const totalValue = prs.reduce((sum: number, pr: any) => sum + (pr.totalAmount || 0), 0);
      setSystemStats({
        totalUsers: 1,
        activePRs: prs.length,
        totalPRValue: totalValue,
        pendingApprovals: pendingPRs.length,
        monthlyPRs: monthlyPRs.length,
        approvalRate: prs.length > 0 ? (approvedPRs.length / prs.length) * 100 : 0
      });
    }
  };

  const loadSettings = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('*');

      if (settingsData) {
        const settingsMap = settingsData.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setSettings({
          smtp: settingsMap.smtp_config || settings.smtp,
          features: settingsMap.feature_flags || settings.features,
          integrations: settingsMap.integrations || settings.integrations
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleInviteUser = async () => {
    setIsLoading(true);
    const { email, role, department } = inviteForm;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      // Create invitation record in Supabase
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email,
          invited_by: user?.id,
          invite_type: 'user_invite',
          role,
          department,
          permissions: role === 'SuperUser' ? ['all_permissions'] : [],
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (inviteError) {
        throw inviteError;
      }

      // Create invitation link
      const inviteLink = `${window.location.origin}/invite?token=${inviteData.token}&email=${encodeURIComponent(email)}`;

      // Send invitation email (this would be handled by an edge function in production)
      const emailBody = `Dear ${email.split('@')[0]},

You have been invited to join the Oversight Procurement Management System as a ${role}.

To complete your account setup, please click the link below:
${inviteLink}

This invitation will expire on ${new Date(inviteData.expires_at).toLocaleDateString()}.

Your role: ${role}
${department ? `Department: ${department}` : ''}

If you have any questions, please contact your administrator.

Best regards,
The Oversight Team`;

      // In production, this would call an edge function to send the email
      console.log('Invitation Email:', {
        to: email,
        subject: 'Welcome to Oversight - Complete Your Account Setup',
        body: emailBody,
        inviteLink
      });

      // For demo purposes, show the invite link
      toast({
        title: 'Invitation Created',
        description: `Invitation sent to ${email}. Check console for invite link (in production, this would be emailed).`,
      });

      console.log('🔗 Invitation Link (for testing):', inviteLink);

      // Update UI
      const invitedUser: User = {
        id: inviteData.id,
        email,
        role: role as User['role'],
        name: `${email.split('@')[0]} (Invited)`,
        department,
        status: 'Invited' as User['status'],
        createdAt: new Date()
      };
      setUsers(prev => [...prev, invitedUser]);

      setInviteForm({ email: '', role: 'Employee', department: '', inviterEmail: user?.email || '' });
      setIsAddUserOpen(false);
    } catch (error: any) {
      console.error('Invite failed:', error);
      toast({ 
        title: 'Invite Failed', 
        description: error?.message || 'Failed to create invitation', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipients.length || !emailForm.subject || !emailForm.body) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would call an edge function to send emails
      console.log('Email to send:', {
        recipients: emailForm.recipients,
        subject: emailForm.subject,
        body: emailForm.body,
        from: user?.email
      });

      toast({ title: 'Email Sent', description: `Email sent to ${emailForm.recipients.length} recipient(s).` });
      setEmailForm({ recipients: [], subject: '', body: '', template: '' });
      setIsEmailComposerOpen(false);
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({ title: 'Send Failed', description: 'Failed to send email. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) setEmailForm(prev => ({ ...prev, subject: template.subject, body: template.body, template: templateId }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast({ title: 'Missing Information', description: 'Please fill in all template fields.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      if (templateForm.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            body: templateForm.body,
            template_type: templateForm.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateForm.id)
          .select()
          .single();

        if (error) throw error;

        const normalized = {
          id: data.id,
          name: data.name,
          subject: data.subject,
          body: data.body,
          type: data.template_type
        };

        setEmailTemplates(prev => prev.map(t => t.id === templateForm.id ? normalized : t));
        toast({ title: 'Template Updated', description: 'Email template updated successfully.' });
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            name: templateForm.name,
            subject: templateForm.subject,
            body: templateForm.body,
            template_type: templateForm.type,
            created_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        const normalized = {
          id: data.id,
          name: data.name,
          subject: data.subject,
          body: data.body,
          type: data.template_type
        };

        setEmailTemplates(prev => [...prev, normalized]);
        toast({ title: 'Template Created', description: 'Email template created successfully.' });
      }

      setTemplateForm({ id: '', name: '', subject: '', body: '', type: 'general' });
      setIsTemplateEditorOpen(false);
    } catch (error) {
      console.error('Template save failed:', error);
      toast({ title: 'Save Failed', description: 'Failed to save template. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save settings to Supabase
      const settingsToSave = [
        { setting_key: 'smtp_config', setting_value: settings.smtp },
        { setting_key: 'feature_flags', setting_value: settings.features },
        { setting_key: 'integrations', setting_value: settings.integrations }
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('system_settings')
          .upsert({
            ...setting,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          });
      }

      toast({ title: 'Settings Saved', description: 'System settings have been updated successfully.' });
    } catch (error) {
      console.error('Save settings failed:', error);
      toast({ title: 'Save Failed', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) return;

      const newStatus = userToUpdate.status === 'Active' ? 'Suspended' : 'Active';
      
      // Update in Supabase (if it's a real user, not an invitation)
      if (userToUpdate.status !== 'Invited') {
        const { error } = await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast({ title: 'User Updated', description: `User status changed to ${newStatus}.` });
    } catch (err) {
      console.error('Toggle status failed:', err);
      toast({ title: 'Update Failed', description: 'Failed to update user status.', variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return;

      if (userToDelete.status === 'Invited') {
        // Delete invitation
        const { error } = await supabase
          .from('invitations')
          .delete()
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Delete user (this will also delete from auth.users via RLS)
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ 
        title: userToDelete.status === 'Invited' ? 'Invitation Cancelled' : 'User Deleted', 
        description: userToDelete.status === 'Invited' ? 'Invitation has been cancelled.' : 'User has been removed from the system.' 
      });
    } catch (err) {
      console.error('Delete failed:', err);
      toast({ title: 'Delete Failed', description: 'Failed to remove user. Please try again.', variant: 'destructive' });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperUser': return 'bg-purple-100 text-purple-800';
      case 'Admin': return 'bg-indigo-100 text-indigo-800';
      case 'Finance': return 'bg-green-100 text-green-800';
      case 'HOD': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Invited': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => `ZAR ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  if (!canManageUsers() && !canSendEmails()) {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the super admin panel.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Super Admin Panel">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">Super Admin Panel</h1>
          <p className="text-muted-foreground">Comprehensive system management, user administration, and procurement oversight</p>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-fade-in-up">
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><Users className="h-8 w-8 text-blue-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{systemStats.totalUsers}</p></div></div></CardContent></Card>
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><ShoppingCart className="h-8 w-8 text-green-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">Active PRs</p><p className="text-2xl font-bold">{systemStats.activePRs}</p></div></div></CardContent></Card>
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><DollarSign className="h-8 w-8 text-purple-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">Total Value</p><p className="text-xl font-bold">{formatCurrency(systemStats.totalPRValue)}</p></div></div></CardContent></Card>
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><Activity className="h-8 w-8 text-orange-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">Pending</p><p className="text-2xl font-bold">{systemStats.pendingApprovals}</p></div></div></CardContent></Card>
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><Calendar className="h-8 w-8 text-indigo-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">This Month</p><p className="text-2xl font-bold">{systemStats.monthlyPRs}</p></div></div></CardContent></Card>
          <Card className="glass-card hover-lift"><CardContent className="p-6"><div className="flex items-center"><TrendingUp className="h-8 w-8 text-emerald-600" /><div className="ml-4"><p className="text-sm font-medium text-muted-foreground">Approval Rate</p><p className="text-2xl font-bold">{systemStats.approvalRate.toFixed(1)}%</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" />User Management</TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email Center</TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2"><FileText className="h-4 w-4" />Email Templates</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4" />System Settings</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Invite User</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter invitee email" /></div>
                      <div className="space-y-2"><Label htmlFor="role">Role</Label><Select value={inviteForm.role} onValueChange={(value: any) => setInviteForm(prev => ({ ...prev, role: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Employee">Employee</SelectItem><SelectItem value="HOD">Head of Department</SelectItem><SelectItem value="Finance">Finance Manager</SelectItem><SelectItem value="Admin">Admin</SelectItem>{userRole === 'SuperUser' && <SelectItem value="SuperUser">Super User</SelectItem>}</SelectContent></Select></div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Input id="department" value={inviteForm.department} onChange={(e) => setInviteForm(prev => ({ ...prev, department: e.target.value }))} placeholder="Enter department" />
                      <p className="text-xs text-muted-foreground">Inviter: {inviteForm.inviterEmail} | Expires in 48 hours</p>
                    </div>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button><Button onClick={handleInviteUser}>Send Invite</Button></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="glass-card"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-muted/50"><tr><th className="text-left p-4 font-medium">User</th><th className="text-left p-4 font-medium">Role</th><th className="text-left p-4 font-medium">Department</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Last Login</th><th className="text-left p-4 font-medium">Actions</th></tr></thead><tbody>{users.map(user => (<tr key={user.id} className="border-b border-border/50 hover:bg-muted/30"><td className="p-4"><div><div className="font-medium">{user.name}</div><div className="text-sm text-muted-foreground">{user.email}</div></div></td><td className="p-4"><Badge className={getRoleColor(user.role)}>{user.role}</Badge></td><td className="p-4">{user.department}</td><td className="p-4"><Badge className={getStatusColor(user.status)}>{user.status}</Badge></td><td className="p-4 text-sm text-muted-foreground">{user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}</td><td className="p-4"><div className="flex gap-2"><Button size="sm" variant="outline"><Eye className="h-3 w-3" /></Button><Button size="sm" variant="outline" onClick={() => toggleUserStatus(user.id)} className={user.status === 'Active' ? 'text-red-600' : 'text-green-600'}>{user.status === 'Active' ? 'Suspend' : 'Activate'}</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteUser(user.id)}><Trash2 className="h-3 w-3" /></Button></div></td></tr>))}</tbody></table></div></CardContent></Card>

          </TabsContent>

          {/* Email Center Tab */}
          <TabsContent value="emails" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Email Center</h2>
              <Button onClick={() => setIsEmailComposerOpen(true)} className="flex items-center gap-2">
                <Send className="h-4 w-4" />Compose Email
              </Button>
            </div>

            {/* Email Composer Dialog */}
            <Dialog open={isEmailComposerOpen} onOpenChange={setIsEmailComposerOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Compose Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recipients</Label>
                      <Select onValueChange={(value) => {
                        const user = users.find(u => u.email === value);
                        if (user && !emailForm.recipients.includes(value)) {
                          setEmailForm(prev => ({ ...prev, recipients: [...prev.recipients, value] }));
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipients" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.status === 'Active').map(user => (
                            <SelectItem key={user.id} value={user.email}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {emailForm.recipients.map(email => (
                          <Badge key={email} variant="secondary" className="flex items-center gap-1">
                            {email}
                            <button
                              onClick={() => setEmailForm(prev => ({
                                ...prev,
                                recipients: prev.recipients.filter(r => r !== email)
                              }))}
                              className="ml-1 text-xs hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Templates</Label>
                      <Select value={emailForm.template} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {emailTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                      id="body"
                      value={emailForm.body}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Email body"
                      rows={10}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEmailComposerOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendEmail} disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Email'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Email Templates</h2>
                <Button onClick={() => {
                  setTemplateForm({ id: '', name: '', subject: '', body: '', type: 'general' });
                  setIsTemplateEditorOpen(true);
                }}>
                  New Template
                </Button>
              </div>

              {/* Templates List */}
              <Card className="glass-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">Type</th>
                          <th className="text-left p-4 font-medium">Subject Preview</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailTemplates.map(template => (
                          <tr key={template.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-4 font-medium">{template.name}</td>
                            <td className="p-4">
                              <Badge variant="outline">{template.type.replace('_', ' ').toUpperCase()}</Badge>
                            </td>
                            <td className="p-4 max-w-md truncate" title={template.subject}>{template.subject}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setTemplateForm(template);
                                    setIsTemplateEditorOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={async () => {
                                    if (confirm(`Delete template "${template.name}"?`)) {
                                      try {
                                        await ApiService.deleteEmailTemplate(template.id);
                                        setEmailTemplates(prev => prev.filter(t => t.id !== template.id));
                                        toast({ title: 'Template Deleted', description: 'Template removed successfully.' });
                                      } catch (error) {
                                        console.error('Delete template failed:', error);
                                        toast({ title: 'Delete Failed', description: 'Failed to delete template.', variant: 'destructive' });
                                      }
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {emailTemplates.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No templates found. Create your first template above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Template Editor Dialog */}
              <Dialog open={isTemplateEditorOpen} onOpenChange={setIsTemplateEditorOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{templateForm.id ? 'Edit Template' : 'New Template'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., PR Approval Notification"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-type">Type</Label>
                      <Select value={templateForm.type} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as EmailTemplate['type'] }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pr_approved">PR Approved</SelectItem>
                          <SelectItem value="pr_declined">PR Declined</SelectItem>
                          <SelectItem value="pr_split">PR Split</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-subject">Subject</Label>
                      <Input
                        id="template-subject"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Subject with placeholders like {TRANSACTION_ID}"
                      />
                      <p className="text-xs text-muted-foreground">Use placeholders like &#123;EMPLOYEE_NAME&#125;, &#123;TRANSACTION_ID&#125;, &#123;AMOUNT&#125;</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-body">Body</Label>
                      <Textarea
                        id="template-body"
                        value={templateForm.body}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Email body with placeholders..."
                        rows={12}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsTemplateEditorOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate} disabled={isLoading}>
                        {isLoading ? 'Saving...' : (templateForm.id ? 'Update' : 'Create')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">System Settings</h2>
              <p className="text-muted-foreground">Configure global settings, SMTP, integrations and feature flags.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SMTP Configuration */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    SMTP Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={settings.smtp.host}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, host: e.target.value } }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={settings.smtp.port}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, port: parseInt(e.target.value) || 587 } }))}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Username</Label>
                      <Input
                        id="smtp-user"
                        value={settings.smtp.user}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, user: e.target.value } }))}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">Password</Label>
                      <Input
                        id="smtp-pass"
                        type="password"
                        value={settings.smtp.pass}
                        onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, pass: e.target.value } }))}
                        placeholder="App password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Flags */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Feature Flags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>PR Splitting</Label>
                      <p className="text-sm text-muted-foreground">Allow splitting large PRs into smaller ones</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features.splitPRs}
                      onChange={(e) => setSettings(prev => ({ ...prev, features: { ...prev.features, splitPRs: e.target.checked } }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Approval Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send automated reminders for pending approvals</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features.reminders}
                      onChange={(e) => setSettings(prev => ({ ...prev, features: { ...prev.features, reminders: e.target.checked } }))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Enable email notifications for all events</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.features.notifications}
                      onChange={(e) => setSettings(prev => ({ ...prev, features: { ...prev.features, notifications: e.target.checked } }))}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supabase-url">Supabase URL</Label>
                    <Input
                      id="supabase-url"
                      value={settings.integrations.supabaseUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, supabaseUrl: e.target.value } }))}
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                    <Input
                      id="supabase-key"
                      value={settings.integrations.supabaseKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, supabaseKey: e.target.value } }))}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Changes will take effect immediately
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SuperAdminPanel;