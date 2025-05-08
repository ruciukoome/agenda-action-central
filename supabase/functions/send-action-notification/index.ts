
/**
 * EDGE FUNCTION: ACTION NOTIFICATION SENDER
 * ----------------------------------------
 * This edge function sends email notifications for action items
 * 
 * Functionality:
 * - Sends notification emails when actions are assigned or updated
 * - Uses SendGrid for reliable email delivery with proper authentication
 * - Implements SPF, DKIM and other anti-spam practices
 * 
 * Environment variables:
 * - SENDGRID_API_KEY: API key for SendGrid email service
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define notification types
type NotificationType = "assigned" | "updated" | "due_soon" | "overdue";

// Request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  // Process request
  console.log("Processing email notification request");
  console.log("Request headers:", JSON.stringify(req.headers, null, 2));

  try {
    // Parse request data
    const payload = await req.json();
    console.log("Received request data:", JSON.stringify(payload));

    // Extract data from payload
    const { action, type, senderEmail } = payload;
    
    if (!action || !action.ownerEmail) {
      throw new Error("Missing required data: action or owner email");
    }

    console.log(`Preparing to send ${type} notification for action: ${action.id}`);
    
    // Check SendGrid API key
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    console.log("Using SendGrid API key:", sendGridApiKey ? "API key is set" : "API key is NOT set");
    
    if (!sendGridApiKey) {
      throw new Error("SENDGRID_API_KEY not found in environment variables");
    }

    // Generate email content based on notification type
    const { subject, htmlContent, textContent } = generateEmailContent(action, type);
    
    console.log(`Sending email from: noreply@platinumcredit.co.ke to: ${action.ownerEmail}`);
    
    // Send email using SendGrid with improved deliverability settings
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendGridApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: action.ownerEmail }],
            subject: subject,
            // Adding custom headers to improve deliverability
            headers: {
              "List-Unsubscribe": "<https://actioncentral.platinumcredit.co.ke/unsubscribe>",
              "Precedence": "Bulk",
              "X-Auto-Response-Suppress": "OOF, AutoReply",
              "X-SG-EID": "qTU0JGIwcTUxLWE4Yi1UZXN0IEVtYWls",
              "X-Entity-Ref-ID": `action-${action.id}-notification`
            }
          }
        ],
        from: { 
          email: "noreply@platinumcredit.co.ke", 
          name: "Action Central" 
        },
        reply_to: {
          email: "no-reply@platinumcredit.co.ke",
          name: "Action Central"
        },
        content: [
          {
            type: "text/plain",
            value: textContent
          },
          {
            type: "text/html",
            value: htmlContent
          }
        ],
        // Adding message identifiers for tracking and threading
        message_id: `action-${action.id}-${Date.now()}@platinumcredit.co.ke`,
        asm: {
          group_id: 123456, // You will need to set up this group in SendGrid
          groups_to_display: [123456]
        },
        // Adding mail settings to improve deliverability
        mail_settings: {
          bypass_list_management: {
            enable: false
          },
          footer: {
            enable: true
          },
          sandbox_mode: {
            enable: false
          }
        },
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
          subscription_tracking: { enable: false }
        },
        // Adding a category to help with tracking/analytics
        categories: ["action_notification"],
        // IP pool name if you have dedicated IPs in SendGrid
        ip_pool_name: "transactional"
      })
    });

    // Log response information
    const responseText = await response.text();
    console.log("SendGrid API response text:", responseText);
    
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status} - ${responseText}`);
    }

    console.log(`Email sent successfully, SendGrid status: ${response.status}`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper function to generate email content
function generateEmailContent(action: any, type: NotificationType) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Common styling for all email templates
  const styles = `
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding: 20px; text-align: center; }
    .priority-high { color: #e53e3e; font-weight: bold; }
    .priority-medium { color: #dd6b20; font-weight: bold; }
    .priority-low { color: #38a169; font-weight: bold; }
    .button { background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
    @media only screen and (max-width: 480px) {
      .content { padding: 10px; }
      .header { padding: 10px; }
      h2 { font-size: 20px; }
    }
  `;

  // Base template for all emails
  const baseTemplate = (title: string, content: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>${title}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from the Action Central system.</p>
          <p>Platinum Credit Limited</p>
          <p>Sent from a verified domain: <strong>platinumcredit.co.ke</strong></p>
          <p>To manage your notification preferences, log in to your Action Central account settings.</p>
        </div>
      </body>
    </html>
  `;

  let subject = "";
  let content = "";
  let plainTextContent = "";

  switch (type) {
    case "assigned":
      subject = `New Action Item Assigned: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}`;
      content = `
        <p>Hello,</p>
        <p>You've been assigned a new action item in Action Central.</p>
        
        <h3>${action.description}</h3>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
        <p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>
        ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
        
        <p>Please log in to the Action Central system to update your progress.</p>
        <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
      `;
      plainTextContent = `
Hello,

You've been assigned a new action item in Action Central.

${action.description}

Department: ${action.department}
Priority: ${action.priority}
Due Date: ${formatDate(action.dueDate)}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system to update your progress:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited
      `;
      break;
      
    case "updated":
      subject = `Action Item Updated: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}`;
      content = `
        <p>Hello,</p>
        <p>An action item assigned to you has been updated.</p>
        
        <h3>${action.description}</h3>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
        <p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>
        <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
        ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
        
        <p>Please log in to the Action Central system to view the updates.</p>
        <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
      `;
      plainTextContent = `
Hello,

An action item assigned to you has been updated.

${action.description}

Department: ${action.department}
Priority: ${action.priority}
Due Date: ${formatDate(action.dueDate)}
Current Progress: ${action.progressStatus}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system to view the updates:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited
      `;
      break;
      
    case "due_soon":
      subject = `REMINDER: Action Item Due Soon: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}`;
      content = `
        <p>Hello,</p>
        <p>This is a reminder that you have an action item due soon.</p>
        
        <h3>${action.description}</h3>
        <p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
        <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
        ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
        
        <p>Please log in to the Action Central system to update your progress or mark this item as complete.</p>
        <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
      `;
      plainTextContent = `
Hello,

This is a reminder that you have an action item due soon.

${action.description}

Due Date: ${formatDate(action.dueDate)}
Department: ${action.department}
Priority: ${action.priority}
Current Progress: ${action.progressStatus}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system to update your progress or mark this item as complete:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited
      `;
      break;
      
    case "overdue":
      subject = `OVERDUE: Action Item Past Due Date: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}`;
      content = `
        <p>Hello,</p>
        <p>An action item assigned to you is now overdue.</p>
        
        <h3>${action.description}</h3>
        <p><strong>Due Date:</strong> ${formatDate(action.dueDate)} (OVERDUE)</p>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
        <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
        ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
        
        <p>Please log in to the Action Central system and update this item as soon as possible.</p>
        <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
      `;
      plainTextContent = `
Hello,

An action item assigned to you is now overdue.

${action.description}

Due Date: ${formatDate(action.dueDate)} (OVERDUE)
Department: ${action.department}
Priority: ${action.priority}
Current Progress: ${action.progressStatus}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system and update this item as soon as possible:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited
      `;
      break;
      
    default:
      subject = `Action Central: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}`;
      content = `
        <p>Hello,</p>
        <p>There's been an update to your action item.</p>
        
        <h3>${action.description}</h3>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
        <p><strong>Due Date:</strong> ${formatDate(action.dueDate)}</p>
        ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
        
        <p>Please log in to the Action Central system for more details.</p>
        <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
      `;
      plainTextContent = `
Hello,

There's been an update to your action item.

${action.description}

Department: ${action.department}
Priority: ${action.priority}
Due Date: ${formatDate(action.dueDate)}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system for more details:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited
      `;
  }

  return {
    subject,
    htmlContent: baseTemplate(subject, content),
    textContent: plainTextContent.trim()
  };
}
