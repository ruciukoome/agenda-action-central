
import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { mapActionItemToDatabaseAction } from "@/lib/mappers";
import { toast } from "@/hooks/use-toast";

export async function sendActionNotification(action: ActionItem, type: "assigned" | "updated") {
  try {
    // Get the current session token and user email
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error("No active session found. User must be authenticated to send notifications.");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send notifications.",
        variant: "destructive"
      });
      return;
    }
    
    // Get the sender's email from the authenticated user
    const senderEmail = session.user.email;
    
    // Prepare request information for logging
    const edgeFunctionUrl = "https://mdwrmfqjxakhpwmfyvft.functions.supabase.co/send-action-notification";
    console.info("[Email Service] Sending request from:", senderEmail);
    console.info("[Email Service] Sending to recipient:", action.ownerEmail);
    console.info("[Email Service] Type:", type);
    
    // Prepare the payload that will be sent to the edge function
    const payload = {
      action: {
        ...mapActionItemToDatabaseAction(action),
        id: action.id,
        created_at: action.createdAt,
        updated_at: action.updatedAt
      },
      type,
      senderEmail
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
    
    let responseData;
    try {
      responseData = await response.json();
      console.info("[Email Service] Response data:", responseData);
    } catch (parseError) {
      console.error("[Email Service] Failed to parse response:", parseError);
      responseData = { error: "Failed to parse response" };
    }
    
    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || `Failed to send notification. Status: ${response.status}`);
    }

    console.log("Notification sent successfully:", responseData);
    
    // Show a success toast
    toast({
      title: "Notification Sent",
      description: `Email sent to ${action.ownerEmail}`,
    });
    
    return responseData;
  } catch (error) {
    console.error("Failed to send notification:", error);
    
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Notification Error",
      description: `Failed to send email: ${errorMessage}`,
      variant: "destructive"
    });
    
    throw error;
  }
}
