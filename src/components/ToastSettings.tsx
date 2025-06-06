
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToastSettings } from '@/contexts/ToastSettingsContext';
import { Bell, BellOff } from 'lucide-react';

export function ToastSettings() {
  const { toastsEnabled, toggleToasts } = useToastSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {toastsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Notification Settings
        </CardTitle>
        <CardDescription>
          Control when and how notifications are displayed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="toast-notifications">Show Toast Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Enable or disable popup notifications throughout the app
            </div>
          </div>
          <Switch
            id="toast-notifications"
            checked={toastsEnabled}
            onCheckedChange={toggleToasts}
          />
        </div>
        
        {!toastsEnabled && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <BellOff className="h-4 w-4" />
              Toast notifications are currently disabled
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
