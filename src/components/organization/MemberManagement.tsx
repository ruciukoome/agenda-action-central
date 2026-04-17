import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOrganization, OrgRole } from '@/contexts/OrganizationContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast-wrapper';
import { Loader2, UserPlus, Trash2 } from 'lucide-react';

interface MemberWithEmail {
  id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  email: string;
}

export function MemberManagement() {
  const { organization, isOrgAdmin, refreshMembers } = useOrganization();
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');

  const loadMembers = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-org-members-info', {
        body: { organizationId: organization.id },
      });
      if (error) throw error;
      setMembers(data.members ?? []);
    } catch (err) {
      toast.error('Failed to load members', { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [organization?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !email.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-org-member', {
        body: { email: email.trim(), organizationId: organization.id, role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Member added successfully');
      setEmail('');
      setRole('member');
      await loadMembers();
      await refreshMembers();
    } catch (err) {
      toast.error('Failed to invite member', { description: (err as Error).message });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);
      if (error) throw error;
      toast.success('Role updated');
      await loadMembers();
    } catch (err) {
      toast.error('Failed to update role', { description: (err as Error).message });
    }
  };

  const handleRemove = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      toast.error('You cannot remove yourself');
      return;
    }
    if (!confirm('Remove this member from the organization?')) return;
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      toast.success('Member removed');
      await loadMembers();
    } catch (err) {
      toast.error('Failed to remove member', { description: (err as Error).message });
    }
  };

  if (!organization) return null;

  return (
    <div className="space-y-6">
      {isOrgAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Member
            </CardTitle>
            <CardDescription>
              Add an existing user to your organization by email. They must have already signed up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="invite-email" className="sr-only">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviting}>
                {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>People in {organization.name}</CardDescription>
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
                  <TableHead>Joined</TableHead>
                  {isOrgAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.email}
                      {m.user_id === user?.id && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isOrgAdmin && m.user_id !== user?.id ? (
                        <Select
                          value={m.role}
                          onValueChange={(v) => handleRoleChange(m.id, v as OrgRole)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
                          {m.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(m.created_at).toLocaleDateString()}
                    </TableCell>
                    {isOrgAdmin && (
                      <TableCell className="text-right">
                        {m.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(m.id, m.user_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isOrgAdmin ? 4 : 3} className="text-center text-muted-foreground py-8">
                      No members yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
