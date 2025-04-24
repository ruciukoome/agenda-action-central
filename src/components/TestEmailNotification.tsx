
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ActionItem, Department, ProgressStatus } from '@/types/action';
import { sendActionNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, RefreshCw } from 'lucide-react'; // Using RefreshCw as a loading icon

export function TestEmailNotification() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ email: string | null; token: string | null }>({ 
    email: null, 
    token: null 
  });

  // Check the session info on component mount or when testing
  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || null;
      const token = data.session?.access_token ? "Valid token" : null;
      
      setSessionInfo({
        email,
        token
      });
      
      return { email, token };
    } catch (err) {
      console.error("Error checking session:", err);
      return { email: null, token: null };
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsSending(true);
      setResult(null);
      setError(null);
      
      // Check session first
      const session = await checkSession();
      
      if (!session.email || !session.token) {
        throw new Error("You must be logged in with a valid email address to send test emails.");
      }
      
      // Create a test action item with valid types
      const testAction: ActionItem = {
        id: 'test-' + Date.now(),
        description: 'Test Action Item',
        department: 'Engineering' as Department,
        meetingDate: new Date().toISOString(),
        priority: 'medium',
        ownerEmail: session.email,
        completed: false,
        progressStatus: 'Not Started' as ProgressStatus,
        notes: 'This is a test notification from the Action Central system.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      };
      
      console.log("Sending test email to:", testAction.ownerEmail);
      console.log("Test action:", testAction);
      
      // Send test notification
      const response = await sendActionNotification(testAction, "assigned");
      setResult(response);
      
      toast({
        title: "Test Email Sent",
        description: `Notification sent to ${session.email}`,
      });
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
        <p className="text-sm text-muted-foreground mb-4">
          This will send a test action item notification to your email address. Make sure you're logged in.
        </p>
        
        <Alert className="mb-4">
          <AlertTitle>Session Status</AlertTitle>
          <AlertDescription>
            <div className="text-sm">
              <p><strong>Email:</strong> {sessionInfo.email || "Not authenticated"}</p>
              <p><strong>Auth Token:</strong> {sessionInfo.token || "No valid token"}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={checkSession}
              >
                Check Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error sending email</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <div className="bg-muted p-3 rounded-md mt-4">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTestEmail} disabled={isSending}>
          {isSending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
