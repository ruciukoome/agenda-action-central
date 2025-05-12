
import { ActionItem } from "@/types/action";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

export const getDueStatus = (dueDate?: string): "overdue" | "upcoming" | "future" | "none" => {
  if (!dueDate) return "none";
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "upcoming";
  return "future";
};

// Function to create a secure token for action updates
export const createActionToken = async (actionId: string): Promise<string | null> => {
  try {
    // Create expiration date (14 days from now for better user experience)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);
    
    // Generate a secure random token
    const token = uuidv4();
    
    console.log("Creating token for action:", actionId);
    
    // Save token to the database
    const { error } = await supabase
      .from('action_tokens')
      .insert({
        action_id: actionId,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      });
    
    if (error) {
      console.error("Error creating token:", error);
      return null;
    }
    
    return token;
  } catch (err) {
    console.error("Token creation error:", err);
    return null;
  }
};

// Get the base URL for the application
export const getBaseUrl = (): string => {
  // Use window.location.origin for development and production environments
  return window.location.origin;
};

export const generateActionAssignedEmailContent = async (action: ActionItem): Promise<string> => {
  // Create a token for this action
  const token = await createActionToken(action.id);
  
  // Generate the update link using the current app URL
  const updateLink = token 
    ? `${getBaseUrl()}/update-task/${action.id}?token=${token}` 
    : `${getBaseUrl()}/my-actions`; // Fallback to login page
  
  console.log("Generated update link:", updateLink);
  
  return `
    <h2>You've been assigned a new action item</h2>
    <p><strong>Description:</strong> ${action.description}</p>
    <p><strong>Department:</strong> ${action.department}</p>
    <p><strong>Priority:</strong> ${action.priority}</p>
    ${action.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>` : ''}
    <p><strong>Notes:</strong> ${action.notes || 'No notes provided'}</p>
    <p>You can update your progress by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${updateLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Update Action Progress
      </a>
    </div>
    <p style="font-size: 12px; color: #666;">This link will expire in 14 days. If you need a new link, please contact your administrator.</p>
  `;
};

export const generateActionDueEmailContent = async (action: ActionItem): Promise<string> => {
  const dueStatus = getDueStatus(action.dueDate);
  
  // Create a token for this action
  const token = await createActionToken(action.id);
  
  // Generate the update link using the current app URL
  const updateLink = token 
    ? `${getBaseUrl()}/update-task/${action.id}?token=${token}` 
    : `${getBaseUrl()}/my-actions`; // Fallback to login page
  
  return `
    <h2>${dueStatus === "overdue" ? "OVERDUE ACTION ITEM" : "Action Item Due Soon"}</h2>
    <p><strong>Description:</strong> ${action.description}</p>
    <p><strong>Department:</strong> ${action.department}</p>
    <p><strong>Priority:</strong> ${action.priority}</p>
    <p><strong>Due Date:</strong> ${action.dueDate ? formatDate(action.dueDate) : 'Not specified'}</p>
    <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
    <p>You can update your progress by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${updateLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Update Action Progress
      </a>
    </div>
    <p style="font-size: 12px; color: #666;">This link will expire in 14 days. If you need a new link, please contact your administrator.</p>
  `;
};

// In a real implementation, this would connect to an email service
export const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<boolean> => {
  console.log(`[Email Service] Sending email to: ${to}`);
  console.log(`[Email Service] Subject: ${subject}`);
  console.log(`[Email Service] Content: ${htmlContent}`);
  
  // This would be replaced with actual email service API call
  // For example, using SendGrid, Mailchimp, or AWS SES
  
  // Simulate successful sending
  return true;
};
