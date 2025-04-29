
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Clock, Mail, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EmailIntegrationCard() {
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    assignmentNotifications: true,
    dueDateReminders: true,
    overdueAlerts: true,
    weeklyDigest: false,
    automaticReminders: true
  });

  const toggleNotification = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      
      toast({
        title: `${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, ' $1')}`,
        description: `${newSettings[setting] ? 'Enabled' : 'Disabled'} successfully`,
      });
      
      return newSettings;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Configure automated email notifications for action items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 bg-blue-100 p-2 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Assignment Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically send emails when new actions are assigned
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 bg-amber-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Due Date Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Send reminders when action items are approaching their due date
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Completion Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Notify stakeholders when action items are completed
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="mt-0.5 bg-purple-100 p-2 rounded-full">
                <CalendarClock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Automatic Due Date Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically send reminder emails one day before due dates
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Assignment Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    Email sent when action is assigned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {notificationSettings.assignmentNotifications ? "Enabled" : "Disabled"}
                  </span>
                  <Switch 
                    checked={notificationSettings.assignmentNotifications} 
                    onCheckedChange={() => toggleNotification('assignmentNotifications')}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Due Date Reminders</h3>
                  <p className="text-xs text-muted-foreground">
                    Remind 3 days before due date
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {notificationSettings.dueDateReminders ? "Enabled" : "Disabled"}
                  </span>
                  <Switch 
                    checked={notificationSettings.dueDateReminders} 
                    onCheckedChange={() => toggleNotification('dueDateReminders')}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Overdue Alerts</h3>
                  <p className="text-xs text-muted-foreground">
                    Sent when action becomes overdue
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {notificationSettings.overdueAlerts ? "Enabled" : "Disabled"}
                  </span>
                  <Switch 
                    checked={notificationSettings.overdueAlerts} 
                    onCheckedChange={() => toggleNotification('overdueAlerts')}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Weekly Digest</h3>
                  <p className="text-xs text-muted-foreground">
                    Summary of pending actions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {notificationSettings.weeklyDigest ? "Enabled" : "Disabled"}
                  </span>
                  <Switch 
                    checked={notificationSettings.weeklyDigest} 
                    onCheckedChange={() => toggleNotification('weeklyDigest')}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Automatic Due Date Reminders</h3>
                  <p className="text-xs text-muted-foreground">
                    Send email one day before due date
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {notificationSettings.automaticReminders ? "Enabled" : "Disabled"}
                  </span>
                  <Switch 
                    checked={notificationSettings.automaticReminders} 
                    onCheckedChange={() => toggleNotification('automaticReminders')}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          In a production environment, you would configure these settings to connect with your email provider.
        </p>
      </CardFooter>
    </Card>
  );
}
