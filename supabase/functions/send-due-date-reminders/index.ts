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
        const emailResult = await sendEmailWithSendGrid(
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
  const dueDate = new Date(action.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
          
          <h3>${action.description}</h3>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Department:</strong> ${action.department}</p>
          <p><strong>Priority:</strong> <span class="priority-${action.priority}">${action.priority}</span></p>
          <p><strong>Current Progress:</strong> ${action.progressStatus}</p>
          ${action.notes ? `<p><strong>Notes:</strong> ${action.notes}</p>` : ''}
          
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

Due Date: ${dueDate}
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

// Function to send email using SendGrid API with improved deliverability
async function sendEmailWithSendGrid(to: string, subject: string, htmlContent: string, textContent: string): Promise<any> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sendGridApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
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
          type: "text/plain",
          value: textContent
        },
        {
          type: "text/html",
          value: htmlContent
        }
      ],
      // Adding message identifiers for tracking and threading
      message_id: `due-reminder-${Date.now()}@platinumcredit.co.ke`,
      // Adding hardcoded unsubscribe group ID as requested
      asm: {
        group_id: 31666,
        groups_to_display: [31666]
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
        subscription_tracking: { enable: true }
      },
      // Adding a category to help with tracking/analytics
      categories: ["action_due_reminder"]
    })
  });

  // Log response information for debugging
  const responseText = await response.text();
  console.log("SendGrid API response status:", response.status);
  console.log("SendGrid API response text:", responseText);

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.status} - ${responseText}`);
  }

  return { success: true };
}
