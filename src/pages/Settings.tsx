import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToastSettings } from '@/components/ToastSettings';
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { EmailIntegrationCard } from '@/components/EmailIntegrationCard';
import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Settings() {
  const { user } = useAuth();

  return (
    <AppLayout title="Settings">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-muted-foreground">Manage your profile, security, and preferences</p>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your current account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <PasswordChangeForm />

          <EmailIntegrationCard />

          <ToastSettings />
        </div>
      </div>
    </AppLayout>
  );
}
