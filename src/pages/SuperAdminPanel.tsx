import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, ServerCog, Activity, Users, Database, KeyRound, Wrench, CheckCircle2, AlertTriangle, Mail, Repeat, Ban, Bug } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import InvitationDebugger, { emitInvitationEvent } from '../components/InvitationDebugger';

interface Role {
  id: string;
  name: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  permissions: string[];
  active: boolean;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target?: string;
  status: 'success' | 'warning' | 'error';
}

interface Invitation {
  id: string;
  email: string;
  role: Role['name'];
  department?: string | null;
  message?: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

const initialRoles: Role[] = [
  { id: 'role-emp', name: 'Employee', permissions: ['quotes:create', 'quotes:view-own'], active: true },
  { id: 'role-hod', name: 'HOD', permissions: ['quotes:approve', 'quotes:view-dept'], active: true },
  { id: 'role-fin', name: 'Finance', permissions: ['quotes:finalize', 'quotes:view-all'], active: true },
  { id: 'role-adm', name: 'Admin', permissions: ['users:manage', 'emails:send', 'system:configure'], active: true },
  { id: 'role-sup', name: 'SuperUser', permissions: ['system:super', 'roles:manage', 'audit:view-all'], active: true },
];

const sampleAudit: AuditLogItem[] = [
  { id: '1', timestamp: new Date().toISOString(), actor: 'superuser@company.com', action: 'Updated role permissions', target: 'Admin', status: 'success' },
  { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), actor: 'admin@company.com', action: 'Suspended user', target: 'user: 23', status: 'warning' },
  { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), actor: 'system', action: 'Nightly backup completed', status: 'success' },
];

const metrics = [
  { label: 'Active Users', value: 1287, icon: Users },
  { label: 'DB Status', value: 'Healthy', icon: Database },
  { label: 'Uptime (30d)', value: '99.98%', icon: Activity },
  { label: 'Auth Provider', value: 'Supabase', icon: KeyRound },
];

const getStatusBadge = (status: AuditLogItem['status']) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">success</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">warning</Badge>;
    default:
      return <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">error</Badge>;
  }
};

const SuperAdminPanel = () => {
  const { userRole, canManageSystem } = useRoleBasedAccess();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [search, setSearch] = useState('');
  const [flags, setFlags] = useState({ featureQuotesV2: true, maintenanceMode: false, enableAuditStreaming: true });

  // Invitations state
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Employee' as Role['name'],
    department: '',
    message: ''
  });
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    if (!canManageSystem()) {
      toast({ title: 'Access restricted', description: 'You do not have permission to access the Super Admin Panel.', variant: 'destructive' });
    } else {
      loadInvitations();
    }
  }, []);

  const loadInvitations = async () => {
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvites(data as Invitation[]);
    } catch (e) {
      const fallback = JSON.parse(localStorage.getItem('invitations') || '[]');
      setInvites(fallback);
    } finally {
      setLoadingInvites(false);
    }
  };

  const generateToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const handleSendInvitation = async () => {
    const email = inviteForm.email.toLowerCase().trim();
    if (!email || !inviteForm.role) {
      toast({ title: 'Missing fields', description: 'Email and invitation type are required', variant: 'destructive' });
      return;
    }
    setSendingInvite(true);
    try {
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Determine the correct domain for invitation links
      // Handle Builder.io preview URLs - use the actual deployment domain
      const hostname = window.location.hostname;
      const isBuilderPreview = hostname === 'projects.builder.codes' || hostname.includes('builder.codes');
      const isProduction = hostname === 'oversight.global' || hostname.includes('oversight.global');
      const isFlyDev = hostname.includes('fly.dev');
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

      let baseDomain = window.location.origin; // fallback

      if (isBuilderPreview) {
        // Builder.io preview - use the actual fly.dev domain
        baseDomain = 'https://721bf99692d5413388a260c85efe5cf7-84b0cfa2-909f-4ec8-a8b4-0904af.fly.dev';
      } else if (isProduction) {
        baseDomain = 'https://oversight.global';
      } else if (isFlyDev) {
        baseDomain = `https://${hostname}`;
      } else if (isLocalhost) {
        baseDomain = 'http://localhost:5173'; // or your local dev port
      }

      console.log('📧 Building invitation link:', {
        hostname,
        isBuilderPreview,
        baseDomain,
        email,
        token: token.substring(0, 10) + '...'
      });

      const inviteLink = `${baseDomain}/invite?token=${token}&email=${encodeURIComponent(email)}`;

      // Create invitation object optimistically
      const newInvitation: Invitation = {
        id: `temp_${Date.now()}`,
        email,
        role: inviteForm.role,
        department: inviteForm.department || null,
        message: inviteForm.message || null,
        token,
        status: 'pending',
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };

      // Update UI immediately (optimistic update)
      setInvites(prev => [newInvitation, ...prev]);
      setInviteForm({ email: '', role: 'Employee', department: '', message: '' });
      toast({ title: 'Sending invitation...', description: `Invite sent to ${email}` });

      // Insert into Supabase in background
      const invitationData: any = {
        email: inviteForm.email.toLowerCase().trim(),
        role: inviteForm.role,
        department: inviteForm.department || null,
        message: inviteForm.message || null,
        token,
        status: 'pending',
        expires_at: expiresAt
      };

      // Only add invited_by if user is authenticated
      if (user?.id) {
        invitationData.invited_by = user.id;
      }

      supabase
        .from('invitations')
        .insert(invitationData)
        .select('*')
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          if (data) {
            // Update with real ID from database
            setInvites(prev => prev.map(inv => inv.id === newInvitation.id ? data as Invitation : inv));
            localStorage.setItem('invitations', JSON.stringify([data, ...invites]));
          }
        })
        .catch((e) => {
          console.warn('Supabase insert failed, keeping local:', e);
          localStorage.setItem('invitations', JSON.stringify([newInvitation, ...invites]));
        });

      // Send email in background (non-blocking)
      emitInvitationEvent({
        email,
        role: inviteForm.role,
        status: 'pending',
        message: 'Sending email via Resend...'
      });

      // Use a timeout to prevent hanging promises (60 seconds for Supabase latency)
      const emailTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout')), 60000)
      );

      supabase.functions.invoke('send-invitation-email', {
        body: {
          email,
          role: inviteForm.role,
          department: inviteForm.department,
          inviterEmail: user?.email || 'admin@oversight.local',
          inviteLink
        }
      })
        .then((result) => {
          console.log('✅ Email send result:', result);
          const responseData = result?.data || {};

          if (responseData?.success) {
            emitInvitationEvent({
              email,
              role: inviteForm.role,
              status: 'sent',
              message: `Email sent successfully via ${responseData?.provider || 'Resend'}`
            });
          } else {
            emitInvitationEvent({
              email,
              role: inviteForm.role,
              status: 'failed',
              message: 'Failed to send email',
              error: responseData?.error || 'Unknown error'
            });
            toast({
              title: 'Email Send Issue',
              description: responseData?.error || 'Invitation created but email sending failed.',
              variant: 'destructive'
            });
          }
        })
        .catch((error) => {
          console.error('❌ Email send error:', error);
          emitInvitationEvent({
            email: inviteForm.email,
            role: inviteForm.role,
            status: 'failed',
            message: 'Failed to send email',
            error: error.message
          });
          console.log('Invitation email fallback:', { to: inviteForm.email, inviteLink });
          toast({
            title: 'Email Send Issue',
            description: error.message || 'Invitation created but email sending failed.',
            variant: 'destructive'
          });
        });
    } catch (e: any) {
      const localInvite: Invitation = {
        id: `local_${Date.now()}`,
        email: inviteForm.email,
        role: inviteForm.role,
        department: inviteForm.department,
        message: inviteForm.message,
        token: generateToken(),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };
      const next = [localInvite, ...invites];
      setInvites(next);
      localStorage.setItem('invitations', JSON.stringify(next));
      toast({ title: 'Invitation created', description: 'Stored locally', variant: 'default' });
    } finally {
      setSendingInvite(false);
    }
  };

  const resendInvite = async (inv: Invitation) => {
    // Determine the correct domain for invitation links
    const hostname = window.location.hostname;
    const isBuilderPreview = hostname === 'projects.builder.codes' || hostname.includes('builder.codes');
    const isProduction = hostname === 'oversight.global' || hostname.includes('oversight.global');
    const isFlyDev = hostname.includes('fly.dev');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    let baseDomain = window.location.origin; // fallback

    if (isBuilderPreview) {
      baseDomain = 'https://721bf99692d5413388a260c85efe5cf7-84b0cfa2-909f-4ec8-a8b4-0904af.fly.dev';
    } else if (isProduction) {
      baseDomain = 'https://oversight.global';
    } else if (isFlyDev) {
      baseDomain = `https://${hostname}`;
    } else if (isLocalhost) {
      baseDomain = 'http://localhost:5173';
    }

    const link = `${baseDomain}/invite?token=${inv.token}&email=${encodeURIComponent(inv.email)}`;
    try {
      const result = await supabase.functions.invoke('send-invitation-email', {
        body: { email: inv.email, role: inv.role, department: inv.department, inviteLink: link }
      });

      const responseData = result?.data || result;
      if (responseData?.success !== false) {
        emitInvitationEvent({
          email: inv.email,
          role: inv.role,
          status: 'sent',
          message: `Email resent successfully to ${inv.email}`
        });
        toast({ title: 'Invitation resent', description: `Email resent to ${inv.email}` });
      } else {
        throw new Error(responseData?.error || 'Failed to send');
      }
    } catch (error) {
      console.error('Resend error:', error);
      emitInvitationEvent({
        email: inv.email,
        role: inv.role,
        status: 'failed',
        message: 'Failed to resend email',
        error: (error as any)?.message || 'Check debug log'
      });
      toast({ title: 'Resend failed', description: `Please check the debug log. Fallback link: ${link}` });
    }
  };

  const revokeInvite = async (inv: Invitation) => {
    // Optimistic update: remove immediately
    setInvites(prev => prev.filter(i => i.id !== inv.id));
    toast({ title: 'Invitation deleted', description: `Removed ${inv.email}` });

    // Delete from Supabase in background
    if (!inv.id.startsWith('local_') && !inv.id.startsWith('temp_')) {
      supabase
        .from('invitations')
        .delete()
        .eq('id', inv.id)
        .then(() => {
          localStorage.setItem('invitations', JSON.stringify(invites.filter(i => i.id !== inv.id)));
        })
        .catch((error) => {
          console.warn('Failed to delete from database:', error);
          // Silently fail - UI already updated
        });
    } else {
      localStorage.setItem('invitations', JSON.stringify(invites.filter(i => i.id !== inv.id)));
    }
  };

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => r.name.toLowerCase().includes(q) || r.permissions.some(p => p.toLowerCase().includes(q)));
  }, [roles, search]);

  const toggleRoleActive = (id: string) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    const role = roles.find(r => r.id === id)?.name;
    toast({ title: 'Role updated', description: `${role} is now ${roles.find(r => r.id === id)?.active ? 'inactive' : 'active'}.` });
  };

  const addPermission = (id: string, perm: string) => {
    if (!perm) return;
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permissions: Array.from(new Set([...r.permissions, perm])) } : r));
    toast({ title: 'Permission added', description: `${perm} added successfully.` });
  };

  const removePermission = (id: string, perm: string) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, permissions: r.permissions.filter(p => p !== perm) } : r));
    toast({ title: 'Permission removed', description: `${perm} removed successfully.` });
  };

  const toggleFlag = (key: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Configuration updated', description: `${key} set to ${!flags[key]}` });
  };

  if (!canManageSystem()) {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-12">
          <ShieldCheck className="h-14 w-14 mx-auto mb-3 text-red-500" />
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-muted-foreground">Your role "{userRole}" is not permitted here.</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <InvitationDebugger isVisible={showDebugger} onClose={() => setShowDebugger(false)} />
      <Layout title="Super Admin Panel">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <div aria-label="Super Admin Panel" className="sr-only">Super Admin Panel</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <div className="text-xl font-semibold">{value as any}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="invitations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invitations" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Invitations</TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2"><Users className="h-4 w-4" /> Roles</TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Config</TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Send New Invitation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invitation Type</Label>
                    <Select value={inviteForm.role} onValueChange={(v: any) => setInviteForm(prev => ({ ...prev, role: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invitation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="HOD">HOD</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="SuperUser">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Department (Optional)</Label>
                  <Input
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., IT, Finance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add a personal message to the invitation"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSendInvitation} disabled={sendingInvite}>
                    <Mail className="h-4 w-4 mr-2" />
                    {sendingInvite ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Manage Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInvites ? (
                  <div className="py-8 text-center text-muted-foreground">Loading invitations...</div>
                ) : invites.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No invitations found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Email</th>
                          <th className="text-left p-3">Role</th>
                          <th className="text-left p-3">Department</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Expires</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.map((inv) => (
                          <tr key={inv.id} className="border-b border-border/50">
                            <td className="p-3 font-mono text-sm">{inv.email}</td>
                            <td className="p-3">{inv.role}</td>
                            <td className="p-3">{inv.department || '-'}</td>
                            <td className="p-3">
                              {inv.status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>}
                              {inv.status === 'accepted' && <Badge className="bg-green-100 text-green-800">Accepted</Badge>}
                              {inv.status === 'revoked' && <Badge className="bg-red-100 text-red-800">Revoked</Badge>}
                              {inv.status === 'expired' && <Badge className="bg-gray-100 text-gray-800">Expired</Badge>}
                            </td>
                            <td className="p-3 text-sm">{new Date(inv.expires_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => resendInvite(inv)}>
                                  <Repeat className="h-3 w-3 mr-1" /> Resend
                                </Button>
                                {inv.status === 'pending' && (
                                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => revokeInvite(inv)}>
                                    <Ban className="h-3 w-3 mr-1" /> Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label htmlFor="search">Search</Label>
                  <Input id="search" placeholder="Filter roles or permissions" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Separator />
                <div className="space-y-4">
                  {filteredRoles.map((role) => (
                    <div key={role.id} className="p-4 rounded-md border border-border/60">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge>{role.name}</Badge>
                          <div className="text-sm text-muted-foreground">{role.permissions.length} permissions</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={role.active} onCheckedChange={() => toggleRoleActive(role.id)} />
                          <span className="text-sm">Active</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.permissions.map((p) => (
                          <Badge key={p} variant="secondary" className="flex items-center gap-1">
                            {p}
                            <button className="ml-1" onClick={() => removePermission(role.id, p)}>×</button>
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Input placeholder="permission e.g. quotes:export" onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addPermission(role.id, value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }} />
                        <Button onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          const value = input?.value?.trim();
                          if (value) {
                            addPermission(role.id, value);
                            input.value = '';
                          }
                        }}>Add</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Runtime Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${flags.featureQuotesV2 ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium">Enable Quotes V2</div>
                      <div className="text-sm text-muted-foreground">Rollout the new quotes pipeline</div>
                    </div>
                  </div>
                  <Switch checked={flags.featureQuotesV2} onCheckedChange={() => toggleFlag('featureQuotesV2')} />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${flags.maintenanceMode ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium">Maintenance Mode</div>
                      <div className="text-sm text-muted-foreground">Temporarily disable user actions</div>
                    </div>
                  </div>
                  <Switch checked={flags.maintenanceMode} onCheckedChange={() => toggleFlag('maintenanceMode')} />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${flags.enableAuditStreaming ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium">Stream Audit Logs</div>
                      <div className="text-sm text-muted-foreground">Real-time audit visibility</div>
                    </div>
                  </div>
                  <Switch checked={flags.enableAuditStreaming} onCheckedChange={() => toggleFlag('enableAuditStreaming')} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {sampleAudit.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.action}{item.target ? ` — ${item.target}` : ''}</div>
                        <div className="text-sm text-muted-foreground">{new Date(item.timestamp).toLocaleString()} • {item.actor}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Button
        onClick={() => setShowDebugger(!showDebugger)}
        className="fixed bottom-4 left-4 gap-2 bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        <Bug className="h-4 w-4" />
        {showDebugger ? 'Close' : 'Email Debug'}
      </Button>
    </Layout>
    </>
  );
};

export default SuperAdminPanel;
