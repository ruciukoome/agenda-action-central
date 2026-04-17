import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import { Building2, Users, CreditCard, ListChecks, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  member_count: number;
  action_count: number;
  plan: string;
  status: string;
  subscription_id: string | null;
}

const PLANS = ['free', 'basic', 'premium'] as const;
const STATUSES = ['active', 'expired', 'cancelled'] as const;

export default function SuperAdmin() {
  const { isSuperAdmin, isLoading } = useOrganization();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/app');
    }
  }, [isLoading, isSuperAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [orgsRes, membersRes, actionsRes, subsRes] = await Promise.all([
        supabase.from('organizations').select('id, name, slug, created_at').order('created_at', { ascending: false }),
        supabase.from('organization_members').select('organization_id'),
        supabase.from('actions').select('organization_id'),
        supabase.from('subscriptions').select('id, organization_id, plan, status'),
      ]);

      if (orgsRes.error) throw orgsRes.error;

      const memberCounts = new Map<string, number>();
      (membersRes.data ?? []).forEach((m: any) => {
        memberCounts.set(m.organization_id, (memberCounts.get(m.organization_id) ?? 0) + 1);
      });

      const actionCounts = new Map<string, number>();
      (actionsRes.data ?? []).forEach((a: any) => {
        if (a.organization_id) {
          actionCounts.set(a.organization_id, (actionCounts.get(a.organization_id) ?? 0) + 1);
        }
      });

      const subMap = new Map<string, { id: string; plan: string; status: string }>();
      (subsRes.data ?? []).forEach((s: any) => {
        subMap.set(s.organization_id, { id: s.id, plan: s.plan, status: s.status });
      });

      const enriched: OrgRow[] = (orgsRes.data ?? []).map((o: any) => {
        const sub = subMap.get(o.id);
        return {
          id: o.id,
          name: o.name,
          slug: o.slug,
          created_at: o.created_at,
          member_count: memberCounts.get(o.id) ?? 0,
          action_count: actionCounts.get(o.id) ?? 0,
          plan: sub?.plan ?? 'free',
          status: sub?.status ?? 'active',
          subscription_id: sub?.id ?? null,
        };
      });

      setRows(enriched);
    } catch (err) {
      toast.error('Failed to load platform data', { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const updateSubscription = async (orgId: string, subId: string | null, field: 'plan' | 'status', value: string) => {
    try {
      if (subId) {
        const updates: any = { [field]: value };
        const { error } = await (supabase.from('subscriptions') as any)
          .update(updates)
          .eq('id', subId);
        if (error) throw error;
      } else {
        const insert: any = {
          organization_id: orgId,
          plan: field === 'plan' ? value : 'free',
          status: field === 'status' ? value : 'active',
        };
        const { error } = await (supabase.from('subscriptions') as any).insert(insert);
        if (error) throw error;
      }
      toast.success('Subscription updated');
      await load();
    } catch (err) {
      toast.error('Update failed', { description: (err as Error).message });
    }
  };

  const totalOrgs = rows.length;
  const totalMembers = rows.reduce((s, r) => s + r.member_count, 0);
  const totalActions = rows.reduce((s, r) => s + r.action_count, 0);
  const activeSubs = rows.filter((r) => r.status === 'active').length;

  if (isLoading) {
    return (
      <AppLayout title="Super Admin">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <AppLayout title="Super Admin">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <p className="text-muted-foreground">Platform-wide management</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="h-5 w-5" />} label="Organizations" value={totalOrgs} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Members" value={totalMembers} />
          <StatCard icon={<ListChecks className="h-5 w-5" />} label="Total Actions" value={totalActions} />
          <StatCard icon={<CreditCard className="h-5 w-5" />} label="Active Subs" value={activeSubs} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Manage subscriptions and view org stats</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.slug}</div>
                        </TableCell>
                        <TableCell>{r.member_count}</TableCell>
                        <TableCell>{r.action_count}</TableCell>
                        <TableCell>
                          <Select
                            value={r.plan}
                            onValueChange={(v) => updateSubscription(r.id, r.subscription_id, 'plan', v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLANS.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={r.status}
                            onValueChange={(v) => updateSubscription(r.id, r.subscription_id, 'status', v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No organizations yet
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
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
