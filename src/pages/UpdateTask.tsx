import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ActionItem, ProgressStatus } from "@/types/action";
import { AlertTriangle, Loader2 } from "lucide-react";

// Define the interface for tokens from the database
interface ActionToken {
  id: string;
  action_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  used: boolean;
  action_data: any; // This will contain the action item data
}

export default function UpdateTask() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [action, setAction] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState<ProgressStatus>('Not Started');
  const [isComplete, setIsComplete] = useState(false);
  const [tokenIsValid, setTokenIsValid] = useState(false);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAction = async () => {
      try {
        if (!id || !token) {
          throw new Error("Missing action ID or token");
        }
        
        setIsLoading(true);
        console.log("Fetching action with token validation...");
        
        // Use the database function to validate the token and get the action in one call
        const { data, error } = await supabase
          .rpc('get_action_token_by_id_and_token', { 
            p_action_id: id,
            p_token: token
          });
        
        if (error) {
          console.error("Token validation error:", error);
          throw new Error("Invalid or expired token");
        }
        
        if (!data || data.length === 0) {
          console.error("No data returned for token");
          throw new Error("Invalid or expired token");
        }
        
        // Get the token and action data
        const tokenData = data[0] as ActionToken;
        const actionData = tokenData.action_data;
        
        console.log("Token validated successfully, action data:", actionData);
        setTokenIsValid(true);
        
        // Map the action data to our ActionItem format
        const mappedAction: ActionItem = {
          id: actionData.id,
          description: actionData.description,
          department: actionData.department,
          meetingDate: actionData.meeting_date,
          priority: actionData.priority,
          ownerEmail: actionData.owner_email,
          completed: actionData.completed,
          progressStatus: actionData.progress_status,
          notes: actionData.notes || '',
          createdAt: actionData.created_at,
          updatedAt: actionData.updated_at,
          dueDate: actionData.due_date
        };
        
        // Set action data
        setAction(mappedAction);
        setNotes(mappedAction.notes || '');
        setProgress(mappedAction.progressStatus || 'Not Started');
        setIsComplete(mappedAction.completed || false);
        
      } catch (err: any) {
        console.error("Error loading action:", err);
        setError(err.message || "An unexpected error occurred");
        setTokenIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAction();
  }, [id, token]);

  const handleSubmit = async () => {
    if (!action || !token || !id) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the action with type assertion for progress_status
      const updates = {
        progress_status: progress as any, // Type assertion to handle Continuous
        completed: isComplete,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', action.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Mark the token as used
      const { error: tokenError } = await supabase
        .from('action_tokens')
        .update({ used: true })
        .eq('action_id', id)
        .eq('token', token);
      
      if (tokenError) {
        console.error("Could not mark token as used:", tokenError);
      }
      
      toast.success("Action updated successfully!");
      
      // Redirect after short delay to show toast
      setTimeout(() => {
        navigate('/update-success');
      }, 1500);
      
    } catch (err: any) {
      console.error("Error updating action:", err);
      toast.error(`Failed to update: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div>Loading action details...</div>
        </div>
      </div>
    );
  }

  if (error || !tokenIsValid) {
    return (
      <div className="container py-8">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
            <CardTitle className="text-red-500">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error || "Invalid or expired link"}</p>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              This link may have expired or already been used. Please contact your administrator to get a new link.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => window.close()}>Close Window</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Update Action Item</CardTitle>
          <CardDescription>
            {action?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Department:</span>
              <span>{action?.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Priority:</span>
              <span className={`
                ${action?.priority === 'high' ? 'text-red-500' : ''} 
                ${action?.priority === 'medium' ? 'text-amber-500' : ''} 
                ${action?.priority === 'low' ? 'text-green-500' : ''}
              `}>
                {action?.priority}
              </span>
            </div>
            {action?.dueDate && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Due Date:</span>
                <span>{new Date(action.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="progress">Progress Status</Label>
            <RadioGroup id="progress" value={progress} onValueChange={(value) => setProgress(value as ProgressStatus)} className="flex gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Not Started" id="not-started" />
                <Label htmlFor="not-started">Not Started</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="25%" id="progress-25" />
                <Label htmlFor="progress-25">25%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50%" id="progress-50" />
                <Label htmlFor="progress-50">50%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="75%" id="progress-75" />
                <Label htmlFor="progress-75">75%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="100%" id="progress-100" />
                <Label htmlFor="progress-100">100%</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Continuous" id="progress-continuous" />
                <Label htmlFor="progress-continuous">Continuous</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="completed" checked={isComplete} onCheckedChange={(checked) => setIsComplete(!!checked)} />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add your progress notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-32"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.close()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
