
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, type } = await req.json();
    
    let subject, content;
    
    if (type === "assigned") {
      subject = `New Action Item Assigned: ${action.description}`;
      content = `
        <h2>You've been assigned a new action item</h2>
        <p><strong>Description:</strong> ${action.description}</p>
        <p><strong>Priority:</strong> ${action.priority}</p>
        <p><strong>Due Date:</strong> ${action.due_date ? new Date(action.due_date).toLocaleDateString() : 'Not set'}</p>
      `;
    } else if (type === "updated") {
      subject = `Action Item Updated: ${action.description}`;
      content = `
        <h2>An action item has been updated</h2>
        <p><strong>Description:</strong> ${action.description}</p>
        <p><strong>Progress:</strong> ${action.progress_status}</p>
        <p><strong>Status:</strong> ${action.completed ? 'Completed' : 'In Progress'}</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Action Central <notifications@yourdomain.com>",
      to: [action.owner_email],
      subject,
      html: content,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
