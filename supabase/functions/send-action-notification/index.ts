
/**
 * EDGE FUNCTION: ACTION NOTIFICATIONS
 * ---------------------------------
 * This edge function sends email notifications when actions are assigned or updated
 * 
 * Functionality:
 * - Processes notification requests from the frontend
 * - Connects to SendGrid API to deliver emails
 * - Handles both "assigned" and "updated" notification types
 * - Returns success/error responses to the caller
 * 
 * Environment variables:
 * - SENDGRID_API_KEY: API key for SendGrid email service
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get the API key from environment variables
const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
console.log("Edge function starting. SendGrid API key present:", !!sendGridApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request headers for debugging
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Check for authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header", code: 401 }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log("Processing email notification request");
    
    // Check if we can parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received request data:", JSON.stringify(requestData));
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", details: parseError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { action, type, senderEmail } = requestData;
    
    if (!action || !type || !senderEmail) {
      console.error("Missing required fields in request body");
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, type, and senderEmail are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Preparing to send ${type} notification for action:`, action.id);
    console.log("Using SendGrid API key:", sendGridApiKey ? "API key is set" : "API key is NOT set");
    
    // Get recipient email from the action
    const recipientEmail = action.owner_email || action.ownerEmail;
    
    // Validate recipient email
    if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.includes('@')) {
      console.error("Invalid recipient email:", recipientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    let subject, content;
    
    if (type === "assigned") {
      subject = `New Action Item Assigned: ${action.description}`;
      content = generateAssignedEmailContent(action);
    } else if (type === "updated") {
      subject = `Action Item Updated: ${action.description}`;
      content = generateUpdatedEmailContent(action);
    } else {
      console.error(`Invalid notification type: ${type}`);
      return new Response(
        JSON.stringify({ error: `Invalid notification type: ${type}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Sending email from:", senderEmail, "to:", recipientEmail);
    
    // SendGrid API endpoint
    const sendgridUrl = "https://api.sendgrid.com/v3/mail/send";
    
    try {
      // Send the email using SendGrid's API
      const sendgridResponse = await fetch(sendgridUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: recipientEmail }],
              subject: subject,
              // Adding custom headers to improve deliverability
              headers: {
                "List-Unsubscribe": "<https://actioncentral.platinumcredit.co.ke/unsubscribe>",
                "Precedence": "Bulk",
                "X-Auto-Response-Suppress": "OOF, AutoReply"
              }
            }
          ],
          from: { 
            email: "joseph.odhiambo@platinumcredit.co.ke", 
            name: "Action Central" 
          },
          reply_to: {
            email: "no-reply@platinumcredit.co.ke",
            name: "Action Central"
          },
          content: [
            {
              type: "text/html",
              value: content
            }
          ],
          // Adding SendGrid tracking settings
          tracking_settings: {
            click_tracking: { enable: true },
            open_tracking: { enable: true }
          },
          // Adding a category to help with tracking/analytics
          categories: [type === "assigned" ? "action_assigned" : "action_updated"]
        })
      });
      
      let responseText = '';
      try {
        responseText = await sendgridResponse.text();
        console.log("SendGrid API response text:", responseText);
      } catch (e) {
        console.error("Failed to get response text:", e);
      }
      
      // Check if the email was sent successfully
      if (!sendgridResponse.ok) {
        console.error("SendGrid API error:", sendgridResponse.status, responseText);
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to send email through SendGrid API", 
            details: responseText,
            status: sendgridResponse.status
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log("Email sent successfully, SendGrid status:", sendgridResponse.status);
      
      // SendGrid returns 202 Accepted for successful email requests
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Error from SendGrid API:", emailError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email through SendGrid API", 
          details: emailError.message || String(emailError) 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in edge function:", error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Unhandled error in email notification service", 
        message: error.message || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to generate HTML email content for assigned actions
function generateAssignedEmailContent(action: any): string {
  const dueDate = action.due_date ? new Date(action.due_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Not set';

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-bottom: 3px solid #0070f3; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          .priority-high { color: #e53e3e; font-weight: bold; }
          .priority-medium { color: #dd6b20; font-weight: bold; }
          .priority-low { color: #38a169; font-weight: bold; }
          .button { background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
          .unsubscribe { color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Action Item Assigned</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've been assigned a new action item in Action Central.</p>
            
            <h3>${action.description}</h3>
            <p><strong>Department:</strong> ${action.department}</p>
            <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Notes:</strong> ${action.notes || 'None'}</p>
            
            <p>Please log in to the Action Central system to update your progress.</p>
            <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Action Central system. Please do not reply directly to this email.</p>
            <p>Platinum Credit Limited</p>
            <p>Send from a verified domain: <strong>platinumcredit.co.ke</strong></p>
            <p class="unsubscribe">To manage your notification preferences, please log in to your Action Central account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Function to generate HTML email content for updated actions
function generateUpdatedEmailContent(action: any): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 15px; border-bottom: 3px solid #0070f3; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
          .button { background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
          .unsubscribe { color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Action Item Updated</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>An action item assigned to you has been updated in Action Central.</p>
            
            <h3>${action.description}</h3>
            <p><strong>Progress:</strong> ${action.progress_status}</p>
            <p><strong>Status:</strong> ${action.completed ? 'Completed' : 'In Progress'}</p>
            <p><strong>Notes:</strong> ${action.notes || 'None'}</p>
            
            <p>Please log in to the Action Central system to view the latest updates.</p>
            <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the Action Central system. Please do not reply directly to this email.</p>
            <p>Platinum Credit Limited</p>
            <p>Send from a verified domain: <strong>platinumcredit.co.ke</strong></p>
            <p class="unsubscribe">To manage your notification preferences, please log in to your Action Central account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
