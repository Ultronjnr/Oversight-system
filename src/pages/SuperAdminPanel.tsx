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
      },
      { 
        id: '4', 
        email: 'admin@company.com', 
        role: 'Admin', 
        name: 'Admin User', 
        department: 'Administration',
        status: 'Active',
        lastLogin: new Date('2024-12-01'),
        createdAt: new Date('2024-01-01'),
        permissions: ['manage_users', 'send_emails', 'view_all_data']
      }
    ];
    setUsers(mockUsers);
  };

  const loadEmailTemplates = () => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'PR Approved',
        subject: 'Purchase Requisition Approved - {TRANSACTION_ID}',
        body: 'Dear {EMPLOYEE_NAME},\n\nYour purchase requisition has been approved.\n\nTransaction ID: {TRANSACTION_ID}\nTotal Amount: {AMOUNT}\nApproved by: {APPROVER_NAME}\n\nExpected delivery: {DELIVERY_DATE}\n\nThank you.',
        type: 'pr_approved'
      },
      {
        id: '2',
        name: 'PR Declined',
        subject: 'Purchase Requisition Update - {TRANSACTION_ID}',
        body: 'Dear {EMPLOYEE_NAME},\n\nWe regret to inform you that your purchase requisition has been declined.\n\nTransaction ID: {TRANSACTION_ID}\nReason: {DECLINE_REASON}\nAlternative suggestions: {ALTERNATIVES}\n\nPlease contact us for more information.',
        type: 'pr_declined'
      },
      {
        id: '3',
        name: 'PR Split Notification',
        subject: 'Purchase Requisition Split - {TRANSACTION_ID}',
        body: 'Dear {EMPLOYEE_NAME},\n\nYour purchase requisition has been split for processing efficiency.\n\nOriginal PR: {TRANSACTION_ID}\nSplit into: {SPLIT_COUNT} separate requisitions\nReason: {SPLIT_REASON}\n\nEach split will be processed individually.',
        type: 'pr_split'
      },
      {
        id: '4',
        name: 'Pending Approval Reminder',
        subject: 'Pending Purchase Requisitions - Action Required',
        body: 'Dear {APPROVER_NAME},\n\nYou have {PENDING_COUNT} purchase requisitions awaiting your approval.\n\nPlease review and take action on these pending requests.\n\nAccess your dashboard: [Dashboard Link]',
        type: 'reminder'
      }
    ];
    setEmailTemplates(mockTemplates);
  };

  const loadSystemStats = () => {
    // Mock system statistics
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    const prs = savedPRs ? JSON.parse(savedPRs) : [];
    
    const currentMonth = new Date().getMonth();
    const monthlyPRs = prs.filter((pr: any) => new Date(pr.requestDate).getMonth() === currentMonth);
    const approvedPRs = prs.filter((pr: any) => pr.financeStatus === 'Approved');
    const pendingPRs = prs.filter((pr: any) => pr.hodStatus === 'Pending' || pr.financeStatus === 'Pending');
    const totalValue = prs.reduce((sum: number, pr: any) => sum + (pr.totalAmount || 0), 0);
    
    setSystemStats({
      totalUsers: users.length + 1, // +1 for current admin
      activePRs: prs.length,
      totalPRValue: totalValue,
      pendingApprovals: pendingPRs.length,
      monthlyPRs: monthlyPRs.length,
      approvalRate: prs.length > 0 ? (approvedPRs.length / prs.length) * 100 : 0
    });
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

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all template fields.",
        variant: "destructive"
      });
      return;
    }

    const template: EmailTemplate = {
      id: templateForm.id || Date.now().toString(),
      ...templateForm
    };

    if (templateForm.id) {
      setEmailTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    } else {
      setEmailTemplates(prev => [...prev, template]);
    }

    setTemplateForm({
      id: '',
      name: '',
      subject: '',
      body: '',
      type: 'general'
    });
    setIsTemplateEditorOpen(false);

    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully.",
    });
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
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `ZAR ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

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
          <p className="text-muted-foreground">
            Comprehensive system management, user administration, and procurement oversight
          </p>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-fade-in-up">
          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active PRs</p>
                  <p className="text-2xl font-bold">{systemStats.activePRs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">{formatCurrency(systemStats.totalPRValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{systemStats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{systemStats.monthlyPRs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                  <p className="text-2xl font-bold">{systemStats.approvalRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Center
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Email Templates
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
                          <SelectItem value="all_users">All Users</SelectItem>
                          <SelectItem value="all_hods">All HODs</SelectItem>
                          <SelectItem value="all_finance">All Finance</SelectItem>
                          <SelectItem value="all_employees">All Employees</SelectItem>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" onClick={() => handleTemplateSelect(template.id)}>
                        Use Template
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setTemplateForm(template);
                        setIsTemplateEditorOpen(true);
                      }}>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Email Templates</h2>
              <Dialog open={isTemplateEditorOpen} onOpenChange={setIsTemplateEditorOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>{templateForm.id ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="templateName">Template Name</Label>
                        <Input
                          id="templateName"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter template name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="templateType">Template Type</Label>
                        <Select value={templateForm.type} onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pr_approved">PR Approved</SelectItem>
                            <SelectItem value="pr_declined">PR Declined</SelectItem>
                            <SelectItem value="pr_split">PR Split</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="templateSubject">Subject</Label>
                      <Input
                        id="templateSubject"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter email subject with placeholders like {TRANSACTION_ID}"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="templateBody">Message Body</Label>
                      <Textarea
                        id="templateBody"
                        rows={10}
                        value={templateForm.body}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                        placeholder="Enter template body with placeholders like {EMPLOYEE_NAME}, {AMOUNT}, etc."
                      />
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">Available Placeholders:</p>
                      <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                        <span>{'{EMPLOYEE_NAME}'}</span>
                        <span>{'{TRANSACTION_ID}'}</span>
                        <span>{'{AMOUNT}'}</span>
                        <span>{'{APPROVER_NAME}'}</span>
                        <span>{'{DELIVERY_DATE}'}</span>
                        <span>{'{DECLINE_REASON}'}</span>
                        <span>{'{ALTERNATIVES}'}</span>
                        <span>{'{SPLIT_COUNT}'}</span>
                        <span>{'{PENDING_COUNT}'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setTemplateForm({
                          id: '',
                          name: '',
                          subject: '',
                          body: '',
                          type: 'general'
                        });
                        setIsTemplateEditorOpen(false);
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate}>
                        Save Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input placeholder="587" type="number" />
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
                  <div className="space-y-2">
                    <Label>Failed Login Attempts</Label>
                    <Input placeholder="5" type="number" />
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Procurement Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Auto-approval Threshold (ZAR)</Label>
                    <Input placeholder="5000" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default VAT Rate (%)</Label>
                    <Input placeholder="15" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>PR Expiry Days</Label>
                    <Input placeholder="30" type="number" />
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    Generate Reports
                  </Button>
                  <Button variant="outline" className="w-full">
                    System Backup
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Clear Cache
                  </Button>
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
