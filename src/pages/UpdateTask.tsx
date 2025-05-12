
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

export default function UpdateTask() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  
  const [action, setAction] = useState<ActionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState<ProgressStatus>('Not Started');
  const [isComplete, setIsComplete] = useState(false);
  const [accessIsValid, setAccessIsValid] = useState(false);

  useEffect(() => {
    const fetchAction = async () => {
      try {
        if (!id || !email) {
          throw new Error("Missing action ID or email");
        }
        
        setIsLoading(true);
        console.log("Fetching action with email validation...");
        
        // Get the action directly
        const { data: actionData, error: actionError } = await supabase
          .from('actions')
          .select('*')
          .eq('id', id)
          .eq('owner_email', email)
          .single();
        
        if (actionError) {
          console.error("Action fetch error:", actionError);
          throw new Error("Invalid action ID or email");
        }
        
        if (!actionData) {
          console.error("No action found for the given ID and email");
          throw new Error("Action not found");
        }
        
        console.log("Action data fetched successfully:", actionData);
        setAccessIsValid(true);
        
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
        setAccessIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAction();
  }, [id, email]);

  const handleSubmit = async () => {
    if (!action || !id || !email) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the action
      const updates = {
        progress_status: progress,
        completed: isComplete,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', action.id)
        .eq('owner_email', email);
      
      if (updateError) {
        throw updateError;
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
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (error || !accessIsValid) {
    return (
      <div className="container py-8">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
            <CardTitle className="text-red-500">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error || "Invalid access link"}</p>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              This link may be invalid or you don't have permission to update this action. Please contact your administrator for assistance.
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
