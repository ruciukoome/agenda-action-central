import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/contexts/OrganizationContext';
import { MemberManagement } from '@/components/organization/MemberManagement';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function OrganizationSettings() {
  const { organization, isLoading } = useOrganization();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No organization found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              <p className="text-muted-foreground">Organization settings & members</p>
            </div>
          </div>

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
    </div>
  );
}
