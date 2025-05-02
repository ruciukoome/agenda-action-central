
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

  const dbAction = mapActionItemToDbAction(action as ActionItem, userData.user.id);

  const { data, error } = await supabase
    .from('actions')
    .insert(dbAction)  // Changed from [dbAction] to dbAction
    .select()
    .single();

  if (error) {
    console.error('Error creating action:', error);
    throw error;
  }

  const createdAction = mapDbActionToActionItem(data as DbAction);

  console.log("Action created successfully:", createdAction);
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
