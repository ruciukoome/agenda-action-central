
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
    
    // Prepare request information for logging
    const edgeFunctionUrl = "https://mdwrmfqjxakhpwmfyvft.functions.supabase.co/send-action-notification";
    console.info("[Email Service] Sending request to:", edgeFunctionUrl);
    console.info("[Email Service] Recipient:", action.ownerEmail);
    console.info("[Email Service] Type:", type);
    
    // Prepare the payload that will be sent to the edge function
    const payload = {
      action: {
        ...mapActionItemToDatabaseAction(action),
        id: action.id,
        created_at: action.createdAt,
        updated_at: action.updatedAt
      }, 
      type
    };
    
    console.info("[Email Service] Payload:", JSON.stringify(payload));

    // Make the request with proper authorization
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    console.info("[Email Service] Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(e => ({ error: "Failed to parse error response" }));
      console.error("Notification error details:", errorData);
      throw new Error(errorData.error || `Failed to send notification. Status: ${response.status}`);
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
    
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error instanceof Response) {
      errorMessage = `HTTP Error: ${error.status}`;
    }
    
    toast({
      title: "Notification Error",
      description: `Failed to send email: ${errorMessage}`,
      variant: "destructive"
    });
    
    throw error;
  }
}
