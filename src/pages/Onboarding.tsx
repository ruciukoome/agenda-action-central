
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast-wrapper';
import { Building2, UserPlus, LogOut } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { organization, isLoading: orgLoading, isSuperAdmin, refreshOrg } = useOrganization();
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect users who already belong to an organization to the dashboard.
  // Super admins without an org go to the super admin page.
  // Users can still reach this page intentionally (e.g. via the org switcher's
  // "Create or join another" action) using ?add=1.
  useEffect(() => {
    if (orgLoading) return;
    const params = new URLSearchParams(window.location.search);
    const wantsToAdd = params.get('add') === '1';
    if (wantsToAdd) return;
    if (organization) {
      navigate('/dashboard', { replace: true });
    } else if (isSuperAdmin) {
      navigate('/super-admin', { replace: true });
    }
  }, [orgLoading, organization, isSuperAdmin, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim() || !user) return;
    setIsSubmitting(true);

    try {
      const slug = generateSlug(orgName);

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug,
          created_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Organization name already taken', {
            description: 'Please choose a different name.',
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success('Organization created!', {
        description: `Welcome to ${orgName.trim()}. You've been set as the admin.`,
      });

      await refreshOrg();
      navigate('/app');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!inviteCode.trim() || !user) return;
    setIsSubmitting(true);

    try {
      // Look up org by slug
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', inviteCode.trim().toLowerCase())
        .maybeSingle();

      if (orgError || !org) {
        toast.error('Organization not found', {
          description: 'Please check the invite code and try again.',
        });
        return;
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) {
        if (memberError.code === '23505') {
          toast.info('You are already a member of this organization.');
        } else {
          throw memberError;
        }
        return;
      }

      toast.success('Joined organization!', {
        description: `You are now a member of ${org.name}.`,
      });

      await refreshOrg();
      navigate('/app');
    } catch (error) {
      console.error('Error joining organization:', error);
      toast.error('Failed to join organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutAndGoAuth = async () => {
    try {
      await signOut();
    } finally {
      navigate('/auth', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={handleSignOutAndGoAuth} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Action Central</CardTitle>
          <CardDescription>
            Create a new organization or join an existing one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Join
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g. Acme Corporation"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                />
                {orgName && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {generateSlug(orgName)}
                  </p>
                )}
              </div>
              <Button
                onClick={handleCreateOrg}
                disabled={!orgName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Creating...' : 'Create Organization'}
              </Button>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Organization Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="e.g. acme-corporation"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinOrg()}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your admin for the organization's invite code (slug).
                </p>
              </div>
              <Button
                onClick={handleJoinOrg}
                disabled={!inviteCode.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Joining...' : 'Join Organization'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
