
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ActionItem, Department, ProgressStatus } from '@/types/action';
import { sendActionNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function TestEmailNotification() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestEmail = async () => {
    try {
      setIsSending(true);
      setResult(null);
      
      // Create a test action item with valid types
      const testAction: ActionItem = {
        id: 'test-' + Date.now(),
        description: 'Test Action Item',
        department: 'Engineering', // Using a valid Department value from the enum
        meetingDate: new Date().toISOString(),
        priority: 'medium',
        ownerEmail: '',
        completed: false,
        progressStatus: 'Not Started', // Using the correct ProgressStatus value
        notes: 'This is a test notification from the Action Central system.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      };
      
      // Get current user email from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        testAction.ownerEmail = session.user.email;
        
        // Send test notification
        const response = await sendActionNotification(testAction, "assigned");
        setResult(response);
        
        toast({
          title: "Test Email Sent",
          description: `Notification sent to ${session.user.email}`,
        });
      } else {
        throw new Error("No user email found. Make sure you're logged in.");
      }
    } catch (error) {
      console.error("Test email error:", error);
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
      setResult({ error: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Email Notification</CardTitle>
        <CardDescription>
          Send a test email notification to verify the system is working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will send a test action item notification to your email address. Make sure you're logged in.
        </p>
        {result && (
          <div className="bg-muted p-3 rounded-md mt-4">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTestEmail} disabled={isSending}>
          {isSending ? "Sending..." : "Send Test Email"}
        </Button>
      </CardFooter>
    </Card>
  );
}
