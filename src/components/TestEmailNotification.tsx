
/**
 * TEST EMAIL NOTIFICATION COMPONENT
 * -------------------------------
 * Allows testing of the email notification system
 * 
 * Backend connections:
 * - Calls sendActionNotification() to trigger test emails
 * - Uses Supabase authentication to get current user
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast-wrapper';
import { ActionItem, Department, ProgressStatus } from '@/types/action';
import { sendActionNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send } from 'lucide-react';

export function TestEmailNotification() {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestEmail = async () => {
    try {
      setIsSending(true);
      setResult(null);
      setError(null);
      
      // Get current user email from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error("No user email found. Make sure you're logged in.");
      }
      
      const userEmail = session.user.email;
      
      // Create a test action item with valid types
      const testAction: ActionItem = {
        id: 'test-' + Date.now(),
        description: 'Test Action Item',
        department: 'Engineering' as Department,
        meetingDate: new Date().toISOString(),
        priority: 'medium',
        ownerEmail: userEmail, // Use the user's email
        completed: false,
        progressStatus: 'Not Started' as ProgressStatus,
        notes: 'This is a test notification from the Action Central system.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      };
      
      // Send test notification
      const response = await sendActionNotification(testAction, "assigned");
      setResult(response);
      
      if (response?.error) {
        setError(response.error);
        toast.error("Test Failed", {
          description: response.error,
        });
      } else {
        toast.success("Test Email Sent", {
          description: `Notification sent to ${userEmail}`,
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error("Test Failed", {
        description: errorMessage,
      });
      
      setResult({ error: errorMessage });
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
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error sending email</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap break-all">{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="bg-muted p-3 rounded-md mt-4 overflow-auto max-h-64">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTestEmail} disabled={isSending}>
          {isSending ? (
            <>
              <Send className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Test Email"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
