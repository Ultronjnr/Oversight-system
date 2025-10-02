import { useEffect, useMemo, useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, ServerCog, Activity, Users, Database, KeyRound, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [search, setSearch] = useState('');
  const [flags, setFlags] = useState({ featureQuotesV2: true, maintenanceMode: false, enableAuditStreaming: true });

  useEffect(() => {
    if (!canManageSystem()) {
      toast({ title: 'Access restricted', description: 'You do not have permission to access the Super Admin Panel.', variant: 'destructive' });
    }
  }, []);

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
    <Layout title="Super Admin Panel">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2"><ServerCog className="h-7 w-7" /> Super Admin Panel</h1>
          <p className="text-muted-foreground">System-wide configuration, roles and permissions, and audit visibility</p>
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

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles" className="flex items-center gap-2"><Users className="h-4 w-4" /> Roles</TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2"><Wrench className="h-4 w-4" /> Config</TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2"><Activity className="h-4 w-4" /> Audit</TabsTrigger>
          </TabsList>

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
    </Layout>
  );
};

export default SuperAdminPanel;
