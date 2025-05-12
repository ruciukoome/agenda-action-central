
import { ActionItem } from "@/types/action";

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

// Generate action direct update URL (used for previews and testing)
export const getActionUpdateUrl = (action: ActionItem): string => {
  // This is a placeholder URL - the actual URL will come from the backend
  // with a secure token
  return `https://actioncentral.platinumcredit.co.ke/update-task/${action.id}`;
};

export const generateActionAssignedEmailContent = (action: ActionItem): string => {
  const updateUrl = getActionUpdateUrl(action);

  return `
    <h2>You've been assigned a new action item</h2>
    <p><strong>Description:</strong> ${action.description}</p>
    <p><strong>Department:</strong> ${action.department}</p>
    <p><strong>Priority:</strong> ${action.priority}</p>
    ${action.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>` : ''}
    <p><strong>Notes:</strong> ${action.notes}</p>
    <p>You can update your progress directly by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${updateUrl}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Action Central</a>
    </p>
    <p><small>(No login required when using this link)</small></p>
  `;
};

export const generateActionDueEmailContent = (action: ActionItem): string => {
  const dueStatus = getDueStatus(action.dueDate);
  const updateUrl = getActionUpdateUrl(action);
  
  return `
    <h2>${dueStatus === "overdue" ? "OVERDUE ACTION ITEM" : "Action Item Due Soon"}</h2>
    <p><strong>Description:</strong> ${action.description}</p>
    <p><strong>Department:</strong> ${action.department}</p>
    <p><strong>Priority:</strong> ${action.priority}</p>
    <p><strong>Due Date:</strong> ${action.dueDate ? formatDate(action.dueDate) : 'Not specified'}</p>
    <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
    <p>You can update your progress directly by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${updateUrl}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Action Status</a>
    </p>
    <p><small>(No login required when using this link)</small></p>
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
