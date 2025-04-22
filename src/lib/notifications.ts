
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapActionItemToDatabaseAction } from "@/lib/mappers";
import { toast } from "@/hooks/use-toast";

export async function sendActionNotification(action: ActionItem, type: "assigned" | "updated") {
  try {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error("No active session found. User must be authenticated to send notifications.");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send notifications.",
        variant: "destructive"
      });
      return;
    }
    
    // Log for debugging
    console.info("[Email Service] Sending email to:", action.ownerEmail);
    console.info("[Email Service] Subject:", type === "assigned" ? `New Action Item: ${action.description}` : `Action Item Updated: ${action.description}`);
    
    // Prepare email content for logging (don't log the full HTML in production)
    const emailPreview = `
    <h2>You've been assigned a new action item</h2>
    <p><strong>Description:</strong> ${action.description}</p>
    <p><strong>Department:</strong> ${action.department}</p>
    <p><strong>Priority:</strong> ${action.priority}</p>
    <p><strong>Due Date:</strong> ${action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'Not set'}</p>
    <p><strong>Notes:</strong> ${action.notes}</p>
    <p>Please log in to the Action Central system to update your progress.</p>
  `;
    console.info("[Email Service] Content:", emailPreview);

    // Make the request with proper authorization
    const response = await fetch(
      "https://mdwrmfqjxakhpwmfyvft.functions.supabase.co/send-action-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          action: {
            ...mapActionItemToDatabaseAction(action),
            id: action.id,
            created_at: action.createdAt,
            updated_at: action.updatedAt
          }, 
          type 
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notification error:", errorData);
      throw new Error(errorData.error || "Failed to send notification");
    }

    const result = await response.json();
    console.log("Notification sent successfully:", result);
    
    // Show a success toast
    toast({
      title: "Notification Sent",
      description: `Email sent to ${action.ownerEmail}`,
    });
    
    return result;
  } catch (error) {
    console.error("Failed to send notification:", error);
    toast({
      title: "Notification Error",
      description: `Failed to send email: ${error.message}`,
      variant: "destructive"
    });
    throw error;
  }
}
