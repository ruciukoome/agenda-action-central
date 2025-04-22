
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Get the API key from environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "re_Km6YJ2wp_9Du59wWePYFNxuY9uKogQNw4";
console.log("Edge function starting. API key present:", !!resendApiKey);

// Initialize Resend with the API key
const resend = new Resend(resendApiKey);

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
    
    const { action, type } = requestData;
    
    if (!action || !type) {
      console.error("Missing required fields in request body");
      return new Response(
        JSON.stringify({ error: "Missing required fields: action and type are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Preparing to send ${type} notification for action:`, action.id);
    console.log("Using Resend API key:", resendApiKey ? "API key is set" : "API key is NOT set");
    
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

    console.log("Sending email to:", action.owner_email);
    
    try {
      // Use Resend's default onboarding domain instead of custom domain
      const emailResponse = await resend.emails.send({
        from: "Action Central <onboarding@resend.dev>",
        to: [action.owner_email],
        subject,
        html: content,
      });
      
      console.log("Email sent successfully:", emailResponse);
      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (emailError) {
      console.error("Error from Resend API:", emailError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send email through Resend API", 
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
