import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import { Loader2, MailOpen, Trash2 } from 'lucide-react';

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
  accepted_at: string | null;
}

export function PendingInvitations({ refreshKey = 0 }: { refreshKey?: number }) {
  const { organization, isOrgAdmin } = useOrganization();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('id, email, role, created_at, accepted_at')
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
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
