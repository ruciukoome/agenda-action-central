/**
 * EDGE FUNCTION: DUE DATE REMINDERS
 * -------------------------------
 * This edge function sends reminder emails for actions due tomorrow
 * Run on a schedule via pg_cron (see migrations/20250429000001_setup_cron.sql)
 * 
 * Functionality:
 * - Queries the database for actions due tomorrow
 * - Generates and sends reminder emails via SendGrid API
 * - Logs results for debugging purposes
 * 
 * Environment variables:
 * - SUPABASE_URL: URL of the Supabase project
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for admin access
 * - SENDGRID_API_KEY: API key for SendGrid email service
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const FROM_ADDRESS = "Action Central <info@nafarrosolutions.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require CRON_SECRET for invocation (sent by pg_cron job)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");
  if (!cronSecret || provided !== cronSecret) {
    console.warn("Unauthorized due-date-reminders invocation");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Starting due date reminder check");
    
    // Create Supabase client with service role key for admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate tomorrow's date (for sending reminders one day before)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    
    console.log(`Checking for actions with due date on: ${tomorrowFormatted}`);

    // Query the database for actions due tomorrow with proper date handling
    const { data: actions, error } = await supabase
      .from('actions')
      .select('*')
      .filter('due_date', 'gte', `${tomorrowFormatted}T00:00:00`)
      .filter('due_date', 'lt', `${tomorrowFormatted}T23:59:59`)
      .eq('completed', false); // Only look for incomplete actions

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log(`Found ${actions?.length || 0} actions due tomorrow`);

    // If we have actions due tomorrow, send reminders
    const results = [];
    
    // Transform database actions to match our ActionItem type
    const actionItems = actions?.map(action => ({
      id: action.id,
      description: action.description,
      department: action.department,
      meetingDate: action.meeting_date,
      priority: action.priority,
      ownerEmail: action.owner_email,
      completed: action.completed,
      progressStatus: action.progress_status,
      notes: action.notes,
      createdAt: action.created_at,
      updatedAt: action.updated_at,
      dueDate: action.due_date
    })) || [];
    
    // Send email for each action due tomorrow
    for (const action of actionItems) {
      if (!action.ownerEmail) {
        console.log(`Skipping action ${action.id} - no owner email`);
        continue;
      }

      const { emailHtml, emailText } = generateDueDateReminderEmail(action);
      console.log(`Sending reminder email to ${action.ownerEmail} for action: ${action.description}`);
      
      try {
        const emailResult = await sendEmailWithResend(
          action.ownerEmail,
          "ACTION DUE TOMORROW - " + action.description.substring(0, 50) + (action.description.length > 50 ? "..." : ""),
          emailHtml,
          emailText
        );
        
        results.push({
          actionId: action.id,
          ownerEmail: action.ownerEmail,
          status: "success"
        });
        
        console.log(`Email sent successfully to ${action.ownerEmail}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${action.ownerEmail}:`, emailError);
        
        results.push({
          actionId: action.id,
          ownerEmail: action.ownerEmail,
          status: "error",
          error: emailError.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} due date reminders`,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error sending due date reminders:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Function to generate HTML email content
function generateDueDateReminderEmail(action: any): { emailHtml: string, emailText: string } {
  const esc = (v: unknown): string =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const dueDateRaw = new Date(action.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dueDate = esc(dueDateRaw);
  const desc = esc(action.description);
  const dept = esc(action.department);
  const pri = esc(action.priority);
  const priClass = esc(String(action.priority ?? "").replace(/[^a-z0-9-]/gi, ""));
  const progress = esc(action.progressStatus);
  const notesHtml = action.notes ? `<p><strong>Notes:</strong> ${esc(action.notes)}</p>` : '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Action Item Due Tomorrow</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding: 20px; text-align: center; }
          .priority-high { color: #e53e3e; font-weight: bold; }
          .priority-medium { color: #dd6b20; font-weight: bold; }
          .priority-low { color: #38a169; font-weight: bold; }
          .button { background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
          .unsubscribe { font-size: 11px; color: #999; margin-top: 20px; }
          @media only screen and (max-width: 480px) {
            .content { padding: 10px; }
            .header { padding: 10px; }
            h2 { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Action Item Due Tomorrow</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>This is a reminder that you have an action item due <strong>tomorrow</strong>.</p>
          
          <h3>${desc}</h3>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Department:</strong> ${dept}</p>
          <p><strong>Priority:</strong> <span class="priority-${priClass}">${pri}</span></p>
          <p><strong>Current Progress:</strong> ${progress}</p>
          ${notesHtml}
          
          <p>Please log in to the Action Central system to update your progress or mark this item as complete.</p>
          <a href="https://actioncentral.platinumcredit.co.ke" class="button">Access Action Central</a>
        </div>
        <div class="footer">
          <p>This is an automated message from the Action Central system.</p>
          <p>Platinum Credit Limited</p>
          <p class="unsubscribe">You can <a href="https://actioncentral.platinumcredit.co.ke/unsubscribe">unsubscribe</a> from these notifications at any time.</p>
        </div>
      </body>
    </html>
  `;

  const emailText = `
Hello,

This is a reminder that you have an action item due TOMORROW.

${action.description}

Due Date: ${dueDateRaw}
Department: ${action.department}
Priority: ${action.priority}
Current Progress: ${action.progressStatus}
${action.notes ? `Notes: ${action.notes}` : ''}

Please log in to the Action Central system to update your progress or mark this item as complete:
https://actioncentral.platinumcredit.co.ke

This is an automated message from the Action Central system.
Platinum Credit Limited

To unsubscribe: https://actioncentral.platinumcredit.co.ke/unsubscribe
  `;

  return { emailHtml, emailText };
}

// Function to send email using Resend via Lovable connector gateway
async function sendEmailWithResend(to: string, subject: string, htmlContent: string, textContent: string): Promise<any> {
  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: "info@nafarrosolutions.com",
      subject,
      html: htmlContent,
      text: textContent,
    }),
  });

  const responseText = await response.text();
  console.log("Resend API response status:", response.status);
  console.log("Resend API response text:", responseText);

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status} - ${responseText}`);
  }

  return { success: true };
}
