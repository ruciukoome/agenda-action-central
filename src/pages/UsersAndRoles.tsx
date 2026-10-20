import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import {
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  X,
  RefreshCw,
  Users as UsersIcon,
} from 'lucide-react';

const PLATFORM_ROLES = ['super_admin', 'admin', 'moderator'] as const;
type PlatformRole = (typeof PLATFORM_ROLES)[number];

interface PlatformRoleRow {
  id: string;
  role: string;
  created_at: string;
}
interface OrgMembership {
  org_id: string;
  org_name: string;
  org_slug: string;
  role: string;
}
interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  platform_roles: PlatformRoleRow[];
  organizations: OrgMembership[];
}

const ALL_FILTER = 'all';

export default function UsersAndRoles() {
  const { isSuperAdmin, isLoading } = useOrganization();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(ALL_FILTER);
  const [pendingAdd, setPendingAdd] = useState<{ userId: string; role: PlatformRole } | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{ roleId: string; userEmail: string; role: string } | null>(null);
  const [mutating, setMutating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/app');
    }
  }, [isLoading, isSuperAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(data.users ?? []);
    } catch (err) {
      toast.error('Failed to load users', { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === ALL_FILTER
          ? true
          : roleFilter === 'none'
          ? u.platform_roles.length === 0
          : u.platform_roles.some((r) => r.role === roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: users.length, none: 0 };
    PLATFORM_ROLES.forEach((r) => (c[r] = 0));
    users.forEach((u) => {
      if (u.platform_roles.length === 0) c.none += 1;
      u.platform_roles.forEach((r) => {
        c[r.role] = (c[r.role] ?? 0) + 1;
      });
    });
    return c;
  }, [users]);

  const addRole = async (userId: string, role: PlatformRole) => {
    setMutating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
      toast.success(`Role "${role}" assigned`);
      await load();
    } catch (err) {
      toast.error('Failed to assign role', { description: (err as Error).message });
    } finally {
      setMutating(false);
      setPendingAdd(null);
    }
  };

  const removeRole = async (roleId: string) => {
    setMutating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      if (error) throw error;
      toast.success('Role removed');
      await load();
    } catch (err) {
      toast.error('Failed to remove role', { description: (err as Error).message });
    } finally {
      setMutating(false);
      setPendingRemove(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Users & Roles">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <AppLayout title="Users & Roles">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Users & Roles
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View users by role, search by email, and manage platform-level role assignments.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile label="Total users" value={counts.total} icon={<UsersIcon className="h-4 w-4" />} />
          <StatTile label="Super admins" value={counts.super_admin ?? 0} tone="primary" />
          <StatTile label="Admins" value={counts.admin ?? 0} />
          <StatTile label="Moderators" value={counts.moderator ?? 0} />
          <StatTile label="No platform role" value={counts.none ?? 0} tone="muted" />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Search by email, name, or user ID. Filter by platform role.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER}>All roles</SelectItem>
                  {PLATFORM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">No platform role</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Users <span className="text-muted-foreground font-normal">({filtered.length})</span>
            </CardTitle>
            <CardDescription>Click a role badge's × to remove it, or assign a new platform role.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Platform roles</TableHead>
                      <TableHead>Organizations</TableHead>
                      <TableHead>Last sign-in</TableHead>
                      <TableHead className="text-right">Assign role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const assignedRoles = new Set(u.platform_roles.map((r) => r.role));
                      const availableRoles = PLATFORM_ROLES.filter((r) => !assignedRoles.has(r));
                      const initials = (u.full_name || u.email || '?')
                        .split(/[\s@]/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((s) => s[0]?.toUpperCase())
                        .join('');

                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{initials || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{u.full_name ?? '—'}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {u.email ?? '(no email)'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.platform_roles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {u.platform_roles.map((r) => (
                                  <Badge
                                    key={r.id}
                                    variant={r.role === 'super_admin' ? 'default' : 'secondary'}
                                    className="gap-1 pr-1"
                                  >
                                    {r.role}
                                    <button
                                      type="button"
                                      className="ml-0.5 rounded-sm hover:bg-foreground/10 p-0.5"
                                      onClick={() =>
                                        setPendingRemove({
                                          roleId: r.id,
                                          userEmail: u.email ?? u.id,
                                          role: r.role,
                                        })
                                      }
                                      aria-label={`Remove ${r.role}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.organizations.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {u.organizations.map((o) => (
                                  <Badge key={o.org_id} variant="outline" className="text-xs">
                                    {o.org_name} · {o.role}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {u.last_sign_in_at
                              ? new Date(u.last_sign_in_at).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            {availableRoles.length === 0 ? (
                              <span className="text-xs text-muted-foreground">All assigned</span>
                            ) : (
                              <Select
                                value=""
                                onValueChange={(v) =>
                                  setPendingAdd({ userId: u.id, role: v as PlatformRole })
                                }
                              >
                                <SelectTrigger className="w-36 h-8 ml-auto">
                                  <span className="flex items-center gap-1 text-xs">
                                    <UserPlus className="h-3 w-3" /> Add role
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm add */}
      <AlertDialog open={!!pendingAdd} onOpenChange={(o) => !o && setPendingAdd(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign platform role?</AlertDialogTitle>
            <AlertDialogDescription>
              Grant the <strong>{pendingAdd?.role}</strong> role. This change takes effect immediately and may grant
              elevated access across the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutating}
              onClick={() => pendingAdd && addRole(pendingAdd.userId, pendingAdd.role)}
            >
              {mutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm remove */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove platform role?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke the <strong>{pendingRemove?.role}</strong> role from{' '}
              <strong>{pendingRemove?.userEmail}</strong>. They will lose any privileges granted by this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutating}
              onClick={() => pendingRemove && removeRole(pendingRemove.roleId)}
            >
              {mutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: 'primary' | 'muted';
}) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary/10 text-primary'
      : tone === 'muted'
      ? 'bg-muted text-muted-foreground'
      : 'bg-secondary text-secondary-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
          <div className={`p-2 rounded-md ${toneClass}`}>{icon ?? <ShieldCheck className="h-4 w-4" />}</div>
        </div>
      </CardContent>
    </Card>
  );
}
