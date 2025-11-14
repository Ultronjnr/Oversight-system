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
import { Users, Mail, Settings, Shield, Send, UserPlus, Eye, Trash2, Database, Server, Key, Activity, AlertTriangle } from 'lucide-react';

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

interface SystemMetric {
    name: string;
    value: string | number;
    status: 'healthy' | 'warning' | 'error';
}

const SuperAdminPanel = () => {
    const { user } = useAuth();
    const { canManageSystem, userRole } = useRoleBasedAccess();
    const [users, setUsers] = useState<User[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

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
        if (canManageSystem()) {
            loadUsers();
            loadEmailTemplates();
            loadSystemMetrics();
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
                department: 'Operations',
                status: 'Active',
                lastLogin: new Date('2024-12-01'),
                createdAt: new Date('2024-01-01')
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

    const loadSystemMetrics = () => {
        const mockMetrics: SystemMetric[] = [
            { name: 'Database Status', value: 'Connected', status: 'healthy' },
            { name: 'API Response Time', value: '120ms', status: 'healthy' },
            { name: 'Active Users', value: '247', status: 'healthy' },
            { name: 'Storage Used', value: '68%', status: 'warning' },
            { name: 'Error Rate', value: '0.2%', status: 'healthy' }
        ];
        setSystemMetrics(mockMetrics);
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

    const getMetricStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    if (!canManageSystem()) {
        return (
            <Layout title="Access Denied">
                <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access the Super Admin panel.</p>
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
                        Complete system administration and management control
                    </p>
                </div>

                {/* System Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {systemMetrics.map((metric, index) => (
                        <Card key={index} className="glass-card">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{metric.name}</p>
                                        <p className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                                            {metric.value}
                                        </p>
                                    </div>
                                    <Activity className={`h-5 w-5 ${getMetricStatusColor(metric.status)}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
                        <TabsTrigger value="system" className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            System Settings
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Security
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
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="SuperUser">Super User</SelectItem>
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
                    <TabsContent value="system" className="space-y-6">
                        <h2 className="text-2xl font-bold">System Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        Database Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Database URL</Label>
                                        <Input placeholder="postgresql://..." type="password" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Connection Pool Size</Label>
                                        <Input placeholder="20" type="number" />
                                    </div>
                                    <Button>Save Configuration</Button>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Email Configuration
                                    </CardTitle>
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
                                    <CardTitle className="flex items-center gap-2">
                                        <Server className="h-5 w-5" />
                                        API Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>API Base URL</Label>
                                        <Input placeholder="https://api.company.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rate Limit (requests/min)</Label>
                                        <Input placeholder="100" type="number" />
                                    </div>
                                    <Button>Save Configuration</Button>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Performance Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Cache TTL (seconds)</Label>
                                        <Input placeholder="3600" type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Upload Size (MB)</Label>
                                        <Input placeholder="50" type="number" />
                                    </div>
                                    <Button>Save Settings</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <h2 className="text-2xl font-bold">Security Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Password Policy
                                    </CardTitle>
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
                                        <Label>Max Login Attempts</Label>
                                        <Input placeholder="5" type="number" />
                                    </div>
                                    <Button>Save Settings</Button>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Access Control
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Two-Factor Authentication</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="disabled">Disabled</SelectItem>
                                                <SelectItem value="optional">Optional</SelectItem>
                                                <SelectItem value="required">Required</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>IP Whitelist</Label>
                                        <Textarea placeholder="Enter IP addresses (one per line)" rows={4} />
                                    </div>
                                    <Button>Save Settings</Button>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Audit Logging
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Log Retention (days)</Label>
                                        <Input placeholder="90" type="number" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Log Level</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="error">Error Only</SelectItem>
                                                <SelectItem value="warn">Warning & Error</SelectItem>
                                                <SelectItem value="info">Info, Warning & Error</SelectItem>
                                                <SelectItem value="debug">All Logs</SelectItem>
                                            </SelectContent>
                                        </Select>
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

export default SuperAdminPanel;
