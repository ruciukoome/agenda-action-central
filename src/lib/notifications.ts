
/**
 * NOTIFICATION SERVICE
 * ------------------
 * This file handles sending email notifications for actions:
 * - Connects to the send-action-notification edge function
 * - Formats and sends notification data
 * - Displays toast messages for notification status
 */

import { supabase } from "@/integrations/supabase/client";
import { ActionItem } from "@/types/action";
import { toast } from "@/components/ui/use-toast";

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
      return { error: "Authentication required" };
    }
    
    // Get the sender's email from the authenticated user
    const senderEmail = session.user.email;
    
    // Ensure we have a valid recipient email
    if (!action.ownerEmail || typeof action.ownerEmail !== 'string' || !action.ownerEmail.includes('@')) {
      console.error("Invalid recipient email:", action.ownerEmail);
      toast({
        title: "Invalid Email",
        description: "The action owner email is invalid.",
        variant: "destructive"
      });
      return { error: "Invalid recipient email address" };
    }
    
    // Prepare request information for logging
    const edgeFunctionUrl = "https://mdwrmfqjxakhpwmfyvft.supabase.co/functions/v1/send-action-notification";
    console.info("[Email Service] Sending request from:", senderEmail);
    console.info("[Email Service] Sending to recipient:", action.ownerEmail);
    console.info("[Email Service] Type:", type);
    console.info("[Email Service] Due date in notification:", action.dueDate || "Not set");
    
    // Prepare the payload that will be sent to the edge function
    const payload = {
      action: {
        ...action,
        id: action.id,
        created_at: action.createdAt,
        updated_at: action.updatedAt,
        owner_email: action.ownerEmail, // Ensure this field is explicitly set
        update_url: `${window.location.origin}/update-task/${action.id}?email=${encodeURIComponent(action.ownerEmail)}`
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
    
    return { error: errorMessage };
  }
}
