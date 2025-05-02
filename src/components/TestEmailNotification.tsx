
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
import { useToast } from '@/hooks/use-toast';
import { ActionItem, Department, ProgressStatus } from '@/types/action';
import { sendActionNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, RefreshCw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TestEmailNotification() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');

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
      
      const userEmail = customEmail || session.user.email;
      console.log("Sending test email to:", userEmail);
      
      // Create a test action item with valid types
      const testAction: ActionItem = {
        id: 'test-' + Date.now(),
        description: 'Test Action Item - ' + new Date().toLocaleTimeString(),
        department: 'Engineering' as Department,
        meetingDate: new Date().toISOString(),
        priority: 'medium',
        ownerEmail: userEmail, // Use the custom email or user's email
        completed: false,
        progressStatus: 'Not Started' as ProgressStatus,
        notes: 'This is a test notification from the Action Central system. Sent at: ' + new Date().toLocaleString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      };
      
      console.log("Test action created with owner email:", testAction.ownerEmail);
      
      // Send test notification
      const response = await sendActionNotification(testAction, "assigned");
      setResult(response);
      
      if (response?.error) {
        setError(response.error);
        toast({
          title: "Test Failed",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test Email Sent",
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
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customEmail">Test Email Address</Label>
            <div className="flex">
              <Input 
                id="customEmail"
                value={customEmail} 
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter email or leave blank to use your account email"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If left blank, will use your logged-in email address
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            This will send a test action item notification to the specified email address. Make sure you're logged in.
          </p>
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error sending email</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap break-all">{error}</AlertDescription>
            </Alert>
          )}
          
          {result && (
            <div className="bg-muted p-3 rounded-md overflow-auto max-h-64">
              <h4 className="font-medium mb-2">Result:</h4>
              <pre className="text-xs overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Check your spam folder as test emails might be filtered there.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {setResult(null); setError(null);}}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
          <Button onClick={handleTestEmail} disabled={isSending}>
            {isSending ? (
              <>
                <Send className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
