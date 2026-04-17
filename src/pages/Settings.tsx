import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToastSettings } from '@/components/ToastSettings';
import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Settings() {
  const { user } = useAuth();

  return (
    <AppLayout title="Settings">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-muted-foreground">Manage your preferences and notifications</p>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
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

          <ToastSettings />
        </div>
      </div>
    </AppLayout>
  );
}
