
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
      content = `
        <h2>You've been assigned a new action item</h2>
        <p><strong>Description:</strong> ${action.description}</p>
        <p><strong>Department:</strong> ${action.department}</p>
        <p><strong>Priority:</strong> ${action.priority}</p>
        <p><strong>Due Date:</strong> ${action.due_date ? new Date(action.due_date).toLocaleDateString() : 'Not set'}</p>
        <p><strong>Notes:</strong> ${action.notes || 'None'}</p>
        <p>Please log in to the Action Central system to update your progress.</p>
      `;
    } else if (type === "updated") {
      subject = `Action Item Updated: ${action.description}`;
      content = `
        <h2>An action item has been updated</h2>
        <p><strong>Description:</strong> ${action.description}</p>
        <p><strong>Progress:</strong> ${action.progress_status}</p>
        <p><strong>Status:</strong> ${action.completed ? 'Completed' : 'In Progress'}</p>
        <p><strong>Notes:</strong> ${action.notes || 'None'}</p>
        <p>Please log in to the Action Central system to view the latest updates.</p>
      `;
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

    console.log("Sending email to:", recipientEmail);
    console.log("Email subject:", subject);
    
    // SendGrid API endpoint
    const sendgridUrl = "https://api.sendgrid.com/v3/mail/send";
    
    // Using a more reliable sender configuration
    const emailPayload = {
      personalizations: [
        {
          to: [{ email: recipientEmail }],
          subject: subject
        }
      ],
      // Using SendGrid verified sender
      from: { email: "notifications@actioncentral.app", name: "Action Central" },
      reply_to: { email: senderEmail },
      content: [
        {
          type: "text/html",
          value: content
        }
      ]
    };

    console.log("Email payload:", JSON.stringify(emailPayload));

    try {
      // Send the email using SendGrid's API
      console.log("Making request to SendGrid API");
      const sendgridResponse = await fetch(sendgridUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendGridApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailPayload)
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
