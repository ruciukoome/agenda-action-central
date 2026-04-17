import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/contexts/OrganizationContext';
import { MemberManagement } from '@/components/organization/MemberManagement';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function OrganizationSettings() {
  const { organization, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <AppLayout title="Organization">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!organization) {
    return (
      <AppLayout title="Organization">
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground">No organization found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={organization.name}>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-muted-foreground">Organization settings & members</p>

          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-muted-foreground">{organization.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Slug:</span>
                  <span className="text-sm text-muted-foreground">{organization.slug}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <MemberManagement />
        </div>
      </div>
    </AppLayout>
  );
}
