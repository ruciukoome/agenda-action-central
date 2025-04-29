
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY")!;

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

    // Query the database for actions due tomorrow
    const { data: actions, error } = await supabase
      .from('actions')
      .select('*')
      .like('due_date', `${tomorrowFormatted}%`); // Using a LIKE query to match the date part

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

      const emailContent = generateDueDateReminderEmail(action);
      console.log(`Sending reminder email to ${action.ownerEmail} for action: ${action.description}`);
      
      try {
        const emailResult = await sendEmailWithSendGrid(
          action.ownerEmail,
          "ACTION DUE TOMORROW - " + action.description,
          emailContent
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
function generateDueDateReminderEmail(action: any): string {
  const dueDate = new Date(action.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
        </style>
      </head>
      <body>
        <div class="container">
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
          </div>
          <div class="footer">
            <p>This is an automated message from the Action Central system. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Function to send email using SendGrid API
async function sendEmailWithSendGrid(to: string, subject: string, htmlContent: string): Promise<any> {
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
          subject: subject
        }
      ],
      from: { email: "ruciukoome@gmail.com", name: "Action Central" },
      content: [
        {
          type: "text/html",
          value: htmlContent
        }
      ]
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} - ${responseText}`);
  }

  return { success: true };
}
