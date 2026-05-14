import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import { Loader2, MailOpen, Send, Trash2 } from 'lucide-react';

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
  accepted_at: string | null;
  last_resent_at: string | null;
  last_resend_status: string | null;
  last_resend_error: string | null;
  resend_count: number | null;
}

export function PendingInvitations({ refreshKey = 0 }: { refreshKey?: number }) {
  const { organization, isOrgAdmin } = useOrganization();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('id, email, role, created_at, accepted_at, last_resent_at, last_resend_status, last_resend_error, resend_count')
        .eq('organization_id', organization.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvites((data || []) as PendingInvite[]);
    } catch (err) {
      toast.error('Failed to load invitations', { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, refreshKey]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this invitation?')) return;
    try {
      const { error } = await supabase.from('pending_invitations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Invitation revoked');
      load();
    } catch (err) {
      toast.error('Failed to revoke', { description: (err as Error).message });
    }
  };

  const handleResend = async (inv: PendingInvite) => {
    if (!organization) return;
    setResendingId(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke('invite-org-member', {
        body: {
          email: inv.email,
          organizationId: organization.id,
          role: inv.role,
          resend: true,
          invitationId: inv.id,
        },
      });
      if (error) {
        let message = error.message;
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) message = body.error;
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      if (data?.email === 'sent') {
        toast.success('Invitation resent', { description: `Email delivered to ${inv.email}` });
      } else if (data?.email === 'failed') {
        toast.error('Resend failed', { description: data?.emailError || 'Email provider rejected the send.' });
      } else {
        toast.success('Resend recorded', { description: 'Email provider not configured — attempt logged.' });
      }
      await load();
    } catch (err) {
      toast.error('Failed to resend', { description: (err as Error).message });
    } finally {
      setResendingId(null);
    }
  };

  if (!organization || !isOrgAdmin) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailOpen className="h-5 w-5" />
          Pending Invitations ({invites.length})
        </CardTitle>
        <CardDescription>
          People invited by email who haven't signed up yet. They'll be added to {organization.name} automatically when they sign up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Last Resend</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant={inv.role === 'admin' ? 'default' : 'secondary'}>{inv.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inv.last_resent_at ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">
                          {new Date(inv.last_resent_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              inv.last_resend_status === 'sent'
                                ? 'default'
                                : inv.last_resend_status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {inv.last_resend_status ?? 'unknown'}
                          </Badge>
                          {inv.resend_count ? (
                            <span className="text-xs text-muted-foreground">×{inv.resend_count}</span>
                          ) : null}
                        </div>
                        {inv.last_resend_status === 'failed' && inv.last_resend_error && (
                          <span className="text-xs text-destructive truncate max-w-[220px]" title={inv.last_resend_error}>
                            {inv.last_resend_error}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={resendingId === inv.id}
                        onClick={() => handleResend(inv)}
                        title="Resend invitation email"
                      >
                        {resendingId === inv.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No pending invitations
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
