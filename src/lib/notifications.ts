
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
import { toast } from "@/lib/toast-wrapper";

export async function sendActionNotification(
  action: ActionItem, 
  type: "assigned" | "updated", 
  ccEmails?: string[], 
  bccEmails?: string[]
) {
  try {
    // Get the current session token and user email
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error("No active session found. User must be authenticated to send notifications.");
      toast.error("Authentication Error", {
        description: "You must be logged in to send notifications.",
      });
      return { error: "Authentication required" };
    }
    
    // Get the sender's email from the authenticated user
    const senderEmail = session.user.email;
    
    // Ensure we have a valid recipient email
    if (!action.ownerEmail || typeof action.ownerEmail !== 'string' || !action.ownerEmail.includes('@')) {
      console.error("Invalid recipient email:", action.ownerEmail);
      toast.error("Invalid Email", {
        description: "The action owner email is invalid.",
      });
      return { error: "Invalid recipient email address" };
    }
    
    console.info("[Email Service] Sending notification, type:", type);
    
    // Prepare the payload that will be sent to the edge function
    const payload = {
      action: {
        ...action,
        id: action.id,
        created_at: action.createdAt,
        updated_at: action.updatedAt,
        owner_email: action.ownerEmail // Ensure this field is explicitly set
      },
      type,
      senderEmail,
      ccEmails: ccEmails || action.ccEmails || [],
      bccEmails: bccEmails || action.bccEmails || []
    };
    
    console.info("[Email Service] Payload prepared for action:", action.id);

    // Invoke the edge function via the Supabase client (uses correct project URL)
    const { data: responseData, error: invokeError } = await supabase.functions.invoke(
      'send-action-notification',
      { body: payload }
    );

    if (invokeError) {
      console.error("[Email Service] Invoke error:", invokeError);
      throw new Error(invokeError.message || "Failed to send notification");
    }

    console.info("[Email Service] Response data:", responseData);

    if ((responseData as any)?.error) {
      throw new Error((responseData as any).error);
    }

    console.log("Notification sent successfully:", responseData);
    
    // Show a success toast
    const totalRecipients = 1 + (ccEmails?.length || 0) + (bccEmails?.length || 0);
    const recipientInfo = totalRecipients > 1 
      ? `${action.ownerEmail} + ${totalRecipients - 1} additional recipient(s)`
      : action.ownerEmail;
    
    toast.success("Notification Sent", {
      description: `Email sent to ${recipientInfo}`,
    });
    
    return responseData;
  } catch (error) {
    console.error("Failed to send notification:", error);
    
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.error("Notification Error", {
      description: `Failed to send email: ${errorMessage}`,
    });
    
    return { error: errorMessage };
  }
}
