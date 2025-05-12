
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ActionItem, ProgressStatus } from "@/types/action";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

// Define the ActionToken type to match the database table
interface ActionToken {
  id: string;
  token: string;
  action_id: string;
  owner_email: string;
  created_at: string;
  expires_at: string; 
  used: boolean;
}

export default function UpdateTask() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [action, setAction] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form state
  const [progress, setProgress] = useState<ProgressStatus>("Not Started");
  const [completed, setCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  
  // Validate token and fetch action data
  useEffect(() => {
    const validateTokenAndFetchAction = async () => {
      try {
        setIsLoading(true);
        
        if (!id || !token) {
          console.error("Missing action ID or token");
          return;
        }
        
        // Call the function to validate token and get action data
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('get_action_token_by_id_and_token', { 
            p_action_id: id, 
            p_token: token 
          });
        
        if (tokenError || !tokenData || tokenData.length === 0) {
          console.error("Invalid or expired token:", tokenError);
          return;
        }
        
        const actionToken = tokenData[0] as ActionToken;
        
        // Check if token is expired
        if (new Date(actionToken.expires_at) < new Date()) {
          console.error("Token has expired");
          return;
        }
        
        // Token is valid, now fetch the action
        const { data: actionData, error: actionError } = await supabase
          .from('actions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (actionError || !actionData) {
          console.error("Error fetching action:", actionError);
          return;
        }
        
        // Map database action to ActionItem type
        const mappedAction: ActionItem = {
          id: actionData.id,
          description: actionData.description,
          department: actionData.department,
          meetingDate: actionData.meeting_date,
          priority: actionData.priority,
          ownerEmail: actionData.owner_email,
          completed: actionData.completed,
          progressStatus: actionData.progress_status,
          notes: actionData.notes || "",
          createdAt: actionData.created_at,
          updatedAt: actionData.updated_at,
          dueDate: actionData.due_date || undefined
        };
        
        setAction(mappedAction);
        setProgress(mappedAction.progressStatus);
        setCompleted(mappedAction.completed);
        setNotes(mappedAction.notes);
        setIsTokenValid(true);
        
      } catch (error) {
        console.error("Error during validation:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    validateTokenAndFetchAction();
  }, [id, token]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !action) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the update payload - ensure progress is one of the allowed values
      const updatePayload = {
        progress_status: progress as ProgressStatus,
        completed: completed,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      
      // Update the action in the database
      const { error } = await supabase
        .from('actions')
        .update(updatePayload)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Show success state
      setIsSubmitted(true);
      toast({
        title: "Update successful",
        description: "The action has been updated successfully.",
      });
      
      // After 3 seconds, redirect to a thank you page
      setTimeout(() => {
        navigate("/update-success");
      }, 3000);
      
    } catch (error) {
      console.error("Error updating action:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle sign-in if the user wants to
  const handleSignIn = () => {
    // Redirect to the auth page with a redirect back to this page
    navigate(`/auth?redirect=/update-task/${id}?token=${token}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container max-w-4xl py-10 space-y-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-xl">Validating your access...</span>
          </div>
        </main>
      </div>
    );
  }
  
  if (!isTokenValid || !action) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container max-w-4xl py-10 space-y-8">
          <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertTitle>Invalid or Expired Link</AlertTitle>
            <AlertDescription>
              <p>The link you're using is either invalid or has expired.</p>
              <p className="mt-2">Please check your email for a newer notification or contact the system administrator.</p>
              {!session && (
                <Button variant="outline" className="mt-4" onClick={handleSignIn}>
                  Sign in to Action Central
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl py-10 space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-2xl">Update Task</CardTitle>
            <CardDescription>
              You can update the status and notes for this task directly from this page.
              No login required.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Update Successful!</h3>
                <p className="text-muted-foreground mb-6">Your changes have been saved successfully.</p>
                <p className="text-sm">You'll be redirected automatically...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-medium">{action.description}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Department</p>
                        <p className="text-muted-foreground">{action.department}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Priority</p>
                        <p className="text-muted-foreground capitalize">{action.priority}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Assigned To</p>
                        <p className="text-muted-foreground">{action.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Due Date</p>
                        <p className="text-muted-foreground">
                          {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="progress" className="text-base">Current Progress</Label>
                      <Select 
                        value={progress} 
                        onValueChange={(value) => setProgress(value as ProgressStatus)}
                      >
                        <SelectTrigger id="progress" className="mt-1.5">
                          <SelectValue placeholder="Select progress" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="25%">25%</SelectItem>
                          <SelectItem value="50%">50%</SelectItem>
                          <SelectItem value="75%">75%</SelectItem>
                          <SelectItem value="100%">100%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="completed" 
                        checked={completed}
                        onCheckedChange={(checked) => setCompleted(checked === true)}
                      />
                      <Label htmlFor="completed" className="text-base font-medium">
                        Mark as Completed
                      </Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes" className="text-base">Notes</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Add any additional notes here..." 
                        className="mt-1.5 min-h-[120px]"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : "Update Task"}
                  </Button>
                  
                  {!session && (
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={handleSignIn}>
                        Sign in to Action Central for full access
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
