import React from 'react';
import { useState, useEffect } from 'react';
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
import { Users, Mail, Settings, Shield, Send, UserPlus, Eye, Trash2, CheckCircle, Clock, Trash } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  name: string;
  department?: string;
  permissions?: string[];
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: Date;
  createdAt: Date;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'quote_approved' | 'quote_declined' | 'general' | 'reminder';
}

const AdminPortal = () => {
  const { user } = useAuth();
  const { canManageUsers, canSendEmails, canManageSystem, userRole } = useRoleBasedAccess();
  const [users, setUsers] = useState<User[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // New User Form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Employee' as User['role'],
    department: '',
    permissions: [] as string[]
  });

  // Email Form
  const [emailForm, setEmailForm] = useState({
    recipients: [] as string[],
    subject: '',
    body: '',
    template: ''
  });

  useEffect(() => {
    if (canManageUsers()) {
      loadUsers();
      loadEmailTemplates();
      loadInvitations();
    }
  }, []);

  const loadUsers = () => {
    // Mock users data - in real app this would come from API
    const mockUsers: User[] = [
      { 
        id: '1', 
        email: 'employee@company.com', 
        role: 'Employee', 
        name: 'John Mokoena', 
        department: 'IT',
        status: 'Active',
        lastLogin: new Date('2024-12-01'),
        createdAt: new Date('2024-01-15')
      },
      { 
        id: '2', 
        email: 'hod@company.com', 
        role: 'HOD', 
        name: 'Sarah Williams', 
        department: 'IT',
        status: 'Active',
        lastLogin: new Date('2024-12-01'),
        createdAt: new Date('2024-01-10')
      },
      { 
        id: '3', 
        email: 'finance@company.com', 
        role: 'Finance', 
        name: 'Michael Chen', 
        department: 'Finance',
        status: 'Active',
        lastLogin: new Date('2024-11-30'),
        createdAt: new Date('2024-01-05')
      }
    ];
    setUsers(mockUsers);
  };

  const loadEmailTemplates = () => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Quote Approved',
        subject: 'Quote Request Approved - Transaction ID: {transactionId}',
        body: 'Dear {userName},\n\nYour quote request for {item} has been approved.\n\nTransaction ID: {transactionId}\nAmount: {amount}\n\nThank you.',
        type: 'quote_approved'
      },
      {
        id: '2',
        name: 'Quote Declined',
        subject: 'Quote Request Update - Transaction ID: {transactionId}',
        body: 'Dear {userName},\n\nWe regret to inform you that your quote request for {item} has been declined.\n\nTransaction ID: {transactionId}\nReason: {reason}\n\nPlease contact us for more information.',
        type: 'quote_declined'
      }
    ];
    setEmailTemplates(mockTemplates);
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await (await import('../lib/supabaseClient')).supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive'
      });
    }
  };

  const cleanupExpiredInvitations = async () => {
    setIsCleaningUp(true);
    try {
      const now = new Date();
      const { data, error } = await (await import('../lib/supabaseClient')).supabase
        .from('invitations')
        .delete()
        .lt('expires_at', now.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;

      await loadInvitations();

      toast({
        title: 'Cleanup Complete',
        description: `${deletedCount} expired invitations have been removed.`,
      });
    } catch (error) {
      console.error('Error cleaning up invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup invitations',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const cleanupUnconfirmedInvitations = async () => {
    setIsCleaningUp(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data, error } = await (await import('../lib/supabaseClient')).supabase
        .from('invitations')
        .delete()
        .eq('status', 'pending')
        .lt('created_at', sevenDaysAgo.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;

      await loadInvitations();

      toast({
        title: 'Cleanup Complete',
        description: `${deletedCount} unconfirmed invitations older than 7 days have been removed.`,
      });
    } catch (error) {
      console.error('Error cleaning up unconfirmed invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup unconfirmed invitations',
        variant: 'destructive'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await (await import('../lib/supabaseClient')).supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      await loadInvitations();

      toast({
        title: 'Success',
        description: 'Invitation has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive'
      });
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      status: 'Active',
      createdAt: new Date()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({
      name: '',
      email: '',
      role: 'Employee',
      department: '',
      permissions: []
    });
    setIsAddUserOpen(false);

    toast({
      title: "User Added",
      description: `${user.name} has been added successfully with login credentials sent to ${user.email}.`,
    });
  };

  const handleSendEmail = () => {
    if (!emailForm.recipients.length || !emailForm.subject || !emailForm.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Mock email sending
    toast({
      title: "Email Sent",
      description: `Email sent to ${emailForm.recipients.length} recipient(s).`,
    });

    setEmailForm({
      recipients: [],
      subject: '',
      body: '',
      template: ''
    });
    setIsEmailComposerOpen(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailForm(prev => ({
        ...prev,
        subject: template.subject,
        body: template.body,
        template: templateId
      }));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' }
        : u
    ));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: "User Deleted",
      description: "User has been removed from the system.",
    });
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canManageUsers() && !canSendEmails()) {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin portal.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Portal">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">Admin Portal</h1>
          <p className="text-muted-foreground">
            Manage users, permissions, and communication across the organization
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Manage Invitations
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Email Center
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Employee">Employee</SelectItem>
                            <SelectItem value="HOD">Head of Department</SelectItem>
                            <SelectItem value="Finance">Finance Manager</SelectItem>
                            {userRole === 'SuperUser' && (
                              <>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="SuperUser">Super User</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Enter department"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddUser}>
                        Add User
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Department</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Last Login</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </td>
                          <td className="p-4">{user.department}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toggleUserStatus(user.id)}
                                className={user.status === 'Active' ? 'text-red-600' : 'text-green-600'}
                              >
                                {user.status === 'Active' ? 'Suspend' : 'Activate'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600"
                                onClick={() => deleteUser(user.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manage Invitations</h2>
                <p className="text-muted-foreground mt-1">View and manage pending invitations</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cleanupExpiredInvitations}
                  disabled={isCleaningUp}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {isCleaningUp ? 'Cleaning...' : 'Clean Expired'}
                </Button>
                <Button
                  variant="outline"
                  onClick={cleanupUnconfirmedInvitations}
                  disabled={isCleaningUp}
                  className="flex items-center gap-2"
                >
                  <Trash className="h-4 w-4" />
                  {isCleaningUp ? 'Cleaning...' : 'Clean Unconfirmed'}
                </Button>
                <Button
                  onClick={loadInvitations}
                  disabled={isCleaningUp}
                  className="flex items-center gap-2"
                >
                  Refresh
                </Button>
              </div>
            </div>

            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Department</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Expires</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No invitations found
                          </td>
                        </tr>
                      ) : (
                        invitations.map(invitation => (
                          <tr key={invitation.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-4">
                              <div className="font-medium">{invitation.email}</div>
                            </td>
                            <td className="p-4">
                              <Badge className={getRoleColor(invitation.role)}>{invitation.role}</Badge>
                            </td>
                            <td className="p-4">{invitation.department || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {invitation.status === 'accepted' && (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                                  </>
                                )}
                                {invitation.status === 'pending' && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                )}
                                {invitation.status === 'expired' && (
                                  <Badge className="bg-red-100 text-red-800">Expired</Badge>
                                )}
                                {invitation.status === 'cancelled' && (
                                  <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => deleteInvitation(invitation.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Center Tab */}
          <TabsContent value="emails" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Email Communication Center</h2>
              <Dialog open={isEmailComposerOpen} onOpenChange={setIsEmailComposerOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Compose Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Template</Label>
                      <Select value={emailForm.template} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template (optional)" />
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Select 
                        onValueChange={(value) => {
                          if (!emailForm.recipients.includes(value)) {
                            setEmailForm(prev => ({ 
                              ...prev, 
                              recipients: [...prev.recipients, value] 
                            }));
                          }
                        }}
                      >
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
                      {emailForm.recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {emailForm.recipients.map(email => (
                            <Badge key={email} variant="secondary" className="flex items-center gap-1">
                              {email}
                              <button 
                                onClick={() => setEmailForm(prev => ({ 
                                  ...prev, 
                                  recipients: prev.recipients.filter(r => r !== email) 
                                }))}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter email subject"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="body">Message</Label>
                      <Textarea
                        id="body"
                        rows={8}
                        value={emailForm.body}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Enter your message..."
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEmailComposerOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendEmail}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emailTemplates.map(template => (
                <Card key={template.id} className="glass-card hover-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{template.name}</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Subject:</strong> {template.subject}</p>
                      <p className="text-sm text-muted-foreground">{template.body.substring(0, 100)}...</p>
                    </div>
                    <Button size="sm" className="mt-4" onClick={() => handleTemplateSelect(template.id)}>
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>SMTP Server</Label>
                    <Input placeholder="smtp.company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input placeholder="noreply@company.com" />
                  </div>
                  <Button>Save Configuration</Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Password Policy</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                        <SelectItem value="medium">Medium (12+ chars, mixed case)</SelectItem>
                        <SelectItem value="strong">Strong (15+ chars, symbols)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input placeholder="60" type="number" />
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPortal;
