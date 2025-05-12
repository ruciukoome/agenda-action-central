
// Edge function that sends email notifications for task assignments and updates
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const body = await req.json();
    const { action, type, senderEmail } = body;
    
    // Validate inputs
    if (!action || !action.id || !action.owner_email) {
      throw new Error("Missing required fields in request");
    }
    
    // Get API key from environment variable
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) {
      throw new Error("SendGrid API key not configured");
    }
    
    // Create email content based on notification type
    const isAssigned = type === "assigned";
    const isUpdated = type === "updated";
    
    if (!isAssigned && !isUpdated) {
      throw new Error("Invalid notification type");
    }
    
    // Format dates for display
    const dueDateFormatted = action.due_date 
      ? new Date(action.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : "No due date set";
    
    // Generate direct URL to update the task - using the new format with email
    const updateUrl = action.update_url || `${req.headers.get("origin")}/update-task/${action.id}?email=${encodeURIComponent(action.owner_email)}`;
    
    // Create standardized email content
    const subject = isAssigned 
      ? `Action Item Assigned: ${action.description}`
      : `Action Item Updated: ${action.description}`;
    
    // Standard styles
    const styles = {
      body: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;",
      header: "background-color: #f0f4f8; padding: 20px; border-radius: 5px 5px 0 0;",
      content: "background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e5e7eb; border-top: none;",
      title: "color: #1e40af; font-size: 20px; margin: 0 0 10px 0;",
      subtitle: "color: #64748b; font-size: 16px; margin: 0 0 20px 0;",
      button: "background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 20px 0;",
      note: "color: #64748b; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 20px;",
      footer: "color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;",
      label: "color: #64748b; font-weight: bold;",
      table: "width: 100%; border-collapse: collapse;",
      tr: "border-bottom: 1px solid #e5e7eb;",
      td: "padding: 10px 0;",
    };
    
    // Create HTML email content
    const html = `
    <div style="${styles.body}">
      <div style="${styles.header}">
        <h1 style="${styles.title}">${subject}</h1>
        <p style="${styles.subtitle}">This ${isAssigned ? 'new task has been assigned to you' : 'task has been updated'}</p>
      </div>
      
      <div style="${styles.content}">
        <table style="${styles.table}">
          <tr style="${styles.tr}">
            <td style="${styles.td}"><span style="${styles.label}">Description:</span></td>
            <td style="${styles.td}">${action.description}</td>
          </tr>
          <tr style="${styles.tr}">
            <td style="${styles.td}"><span style="${styles.label}">Department:</span></td>
            <td style="${styles.td}">${action.department}</td>
          </tr>
          <tr style="${styles.tr}">
            <td style="${styles.td}"><span style="${styles.label}">Priority:</span></td>
            <td style="${styles.td}">${action.priority}</td>
          </tr>
          <tr style="${styles.tr}">
            <td style="${styles.td}"><span style="${styles.label}">Due Date:</span></td>
            <td style="${styles.td}">${dueDateFormatted}</td>
          </tr>
          ${isUpdated && action.progress_status ? `
          <tr style="${styles.tr}">
            <td style="${styles.td}"><span style="${styles.label}">Progress:</span></td>
            <td style="${styles.td}">${action.progress_status}</td>
          </tr>
          ` : ''}
        </table>
        
        <p>You can update your progress on this task by clicking the button below:</p>
        
        <a href="${updateUrl}" style="${styles.button}">Update Task</a>
        
        <div style="${styles.note}">
          <p>This email was sent by ${senderEmail || 'the system'}.</p>
        </div>
      </div>
      
      <div style="${styles.footer}">
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
    `;
    
    // Plain text version for email clients that don't support HTML
    const text = `
    ${subject}
    
    This ${isAssigned ? 'new task has been assigned to you' : 'task has been updated'}
    
    Description: ${action.description}
    Department: ${action.department}
    Priority: ${action.priority}
    Due Date: ${dueDateFormatted}
    ${isUpdated && action.progress_status ? `Progress: ${action.progress_status}` : ''}
    
    You can update your progress on this task by visiting:
    ${updateUrl}
    
    This email was sent by ${senderEmail || 'the system'}.
    
    This is an automated notification. Please do not reply to this email.
    `;
    
    // Send the email using SendGrid API
    const sendgridUrl = "https://api.sendgrid.com/v3/mail/send";
    const sendgridResponse = await fetch(sendgridUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sendgridApiKey}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: action.owner_email }]
          }
        ],
        from: { email: "notifications@mdwrmfqjxakhpwmfyvft.supabase.co", name: "Action Items" },
        subject: subject,
        content: [
          {
            type: "text/plain",
            value: text
          },
          {
            type: "text/html",
            value: html
          }
        ]
      })
    });
    
    // Get the response from SendGrid
    const sendgridData = await sendgridResponse.text();
    const success = sendgridResponse.status >= 200 && sendgridResponse.status < 300;
    
    console.log(`Email ${success ? 'sent successfully' : 'failed to send'} to ${action.owner_email}`);
    
    // Return response
    return new Response(
      JSON.stringify({
        success,
        message: success ? "Notification sent successfully" : "Failed to send notification",
        details: sendgridData
      }),
      {
        status: success ? 200 : 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    console.error("Error processing notification:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error processing notification",
        error: error.message
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
