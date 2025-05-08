
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { toast } from "@/components/ui/use-toast";
import { sendActionNotification } from "@/lib/notifications";
import { DbAction, mapActionItemToDbAction, mapDbActionToActionItem } from "./types";

/**
 * Creates a new action in the database
 * Table: actions
 * Also triggers email notification to the action owner
 */
export async function createAction(action: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActionItem> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Ensure we have a valid owner email
  if (!action.ownerEmail || typeof action.ownerEmail !== 'string' || !action.ownerEmail.includes('@')) {
    toast({
      title: "Invalid Email",
      description: "Please provide a valid email for the action owner.",
      variant: "destructive"
    });
    throw new Error('Owner email is required and must be valid');
  }

  // Log all fields in the action object before saving
  console.log("Creating action in Supabase with data:", JSON.stringify(action, null, 2));
  
  // Explicitly prepare the dbAction object to ensure due date is preserved
  const dbAction = {
    description: action.description,
    department: action.department,
    meeting_date: action.meetingDate,
    priority: action.priority,
    owner_email: action.ownerEmail,
    completed: action.completed,
    progress_status: action.progressStatus,
    notes: action.notes || '',
    user_id: userData.user.id,
    // Make sure due_date is explicitly included
    due_date: action.dueDate ? action.dueDate : null
  };

  // Log the prepared dbAction object
  console.log("Prepared dbAction object:", JSON.stringify(dbAction, null, 2));
  console.log("Due date value:", action.dueDate ? new Date(action.dueDate).toISOString() : "No due date");

  const { data, error } = await supabase
    .from('actions')
    .insert(dbAction)
    .select()
    .single();

  if (error) {
    console.error('Error creating action:', error);
    throw error;
  }

  const createdAction = mapDbActionToActionItem(data as DbAction);

  console.log("Action created successfully:", createdAction);
  console.log("Due date in created action:", createdAction.dueDate || "Not set");
  console.log("Sending notification for new action to:", createdAction.ownerEmail);

  try {
    const notificationResult = await sendActionNotification(createdAction, "assigned");
    if (notificationResult && notificationResult.error) {
      toast({
        title: "Action Created",
        description: `Action was created but email notification failed: ${notificationResult.error}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Action Created",
        description: `Action was created and notification was sent to ${createdAction.ownerEmail}.`,
        variant: "default",
      });
    }
  } catch (emailError) {
    console.error('Error sending notification:', emailError);
    toast({
      title: "Action created",
      description: "Action was created but email notification failed to send.",
      variant: "default",
    });
  }

  return createdAction;
}
