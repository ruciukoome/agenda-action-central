
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with the environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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
    const { action, type } = await req.json();
    console.log(`Preparing to send ${type} notification for action:`, action.id);
    
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
    }

    console.log("Sending email to:", action.owner_email);
    const emailResponse = await resend.emails.send({
      from: "Action Central <notifications@actioncentral.app>",
      to: [action.owner_email],
      subject,
      html: content,
    });
    
    console.log("Email sent successfully:", emailResponse);
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

