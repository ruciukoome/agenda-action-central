/**
 * EDGE FUNCTION: ACTION NOTIFICATION SENDER
 * ----------------------------------------
 * Sends notification emails for action items.
 * - Owner receives a secure, one-time update link.
 * - CC/BCC recipients receive a separate "view-only" notification (no link).
 * - Replies are NOT used to update actions.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType = "assigned" | "updated" | "due_soon" | "overdue";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Client for verifying the caller's JWT
const supabaseAuth = createClient(supabaseUrl, anonKey);
// Client with service role for inserting tokens (server-side only)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const APP_URL = Deno.env.get("APP_URL") || "https://actioncentral.platinumcredit.co.ke";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claims, error: authError } = await supabaseAuth.auth.getClaims(jwt);
    if (authError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json();
    const { action, type, ccEmails = [], bccEmails = [] } = payload as {
      action: any; type: NotificationType; ccEmails?: string[]; bccEmails?: string[];
    };

    if (!action || !action.ownerEmail || !action.id) {
      throw new Error("Missing required data: action, action.id, or owner email");
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const FROM_ADDRESS = "Action Central <info@nafarrosolutions.com>";

    // ---- Generate secure token for owner (used for update + accept/reject) ----
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isRealAction = UUID_RE.test(String(action.id));
    let updateUrl: string | undefined;
    let acceptUrl: string | undefined;
    let rejectUrl: string | undefined;

    if (isRealAction) {
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: tokenError } = await supabaseAdmin
        .from("action_tokens")
        .insert({
          action_id: action.id,
          token,
          used: false,
          expires_at: expiresAt,
          action_data: {
            id: action.id,
            description: action.description,
            department: action.department,
            meeting_date: action.meetingDate,
            priority: action.priority,
            owner_email: action.ownerEmail,
            completed: action.completed,
            progress_status: action.progressStatus,
            notes: action.notes || '',
            created_at: action.createdAt,
            updated_at: action.updatedAt,
            due_date: action.dueDate,
          },
        } as any);

      if (tokenError) {
        console.error("Failed to create action token:", tokenError);
        throw new Error(`Failed to create update token: ${tokenError.message}`);
      }

      updateUrl = `${APP_URL}/update-task/${action.id}?token=${token}`;
      acceptUrl = `${APP_URL}/respond/${action.id}?token=${token}&decision=accept`;
      rejectUrl = `${APP_URL}/respond/${action.id}?token=${token}&decision=reject`;
    } else {
      console.warn("Skipping update-link token: action.id is not a UUID:", action.id);
    }

    // ---- Build ICS calendar invite (all recipients as attendees) ----
    const allAttendees = [
      action.ownerEmail,
      ...(ccEmails || []),
      ...(bccEmails || []),
    ].filter((e) => typeof e === "string" && e.includes("@"));
    const uniqueAttendees = [...new Set(allAttendees)];

    const icsBase64 = buildIcsBase64(action, uniqueAttendees);
    const icsAttachment = {
      filename: "invite.ics",
      content: icsBase64,
      content_type: "text/calendar; method=REQUEST; charset=UTF-8",
    };

    // ---- Build owner email (with secure link + accept/reject + ICS) ----
    const ownerEmail = generateEmailContent(action, type, { isOwner: true, updateUrl, acceptUrl, rejectUrl });
    const ownerResp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [action.ownerEmail],
        reply_to: "info@nafarrosolutions.com",
        subject: ownerEmail.subject,
        html: ownerEmail.htmlContent,
        text: ownerEmail.textContent,
        attachments: [icsAttachment],
      }),
    });

    if (!ownerResp.ok) {
      const t = await ownerResp.text();
      throw new Error(`Resend (owner) error: ${ownerResp.status} - ${t}`);
    }

    // ---- Build follower email (no link, with ICS) for CC + BCC ----
    const followers = [...new Set([...(ccEmails || []), ...(bccEmails || [])]
      .filter((e) => typeof e === "string" && e.includes("@") && e !== action.ownerEmail))];

    let followerCount = 0;
    if (followers.length > 0) {
      const followerEmail = generateEmailContent(action, type, { isOwner: false });
      const followerResp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: ["info@nafarrosolutions.com"],
          bcc: followers,
          reply_to: "info@nafarrosolutions.com",
          subject: followerEmail.subject,
          html: followerEmail.htmlContent,
          text: followerEmail.textContent,
          attachments: [icsAttachment],
        }),
      });
      if (!followerResp.ok) {
        const t = await followerResp.text();
        console.error(`Resend (followers) error: ${followerResp.status} - ${t}`);
      } else {
        followerCount = followers.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent", ownerSent: true, followerCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateEmailContent(
  action: any,
  type: NotificationType,
  opts: { isOwner: boolean; updateUrl?: string; acceptUrl?: string; rejectUrl?: string }
) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const styles = `
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background:#ffffff; }
    .header { background-color: #0284c7; color: #ffffff; padding: 22px; text-align: center; }
    .content { padding: 24px; }
    .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding: 20px; text-align: center; }
    .priority-high { color: #e53e3e; font-weight: bold; }
    .priority-medium { color: #dd6b20; font-weight: bold; }
    .priority-low { color: #38a169; font-weight: bold; }
    .cta-wrap { text-align:center; margin: 28px 0; }
    .cta-btn { display:inline-block; background:#0284c7; color:#ffffff !important; text-decoration:none; padding: 14px 26px; border-radius: 8px; font-weight: bold; }
    .info-box { background-color: #f1f5f9; padding: 14px 16px; border-left: 4px solid #0284c7; margin: 20px 0; border-radius: 4px; }
    .viewer-box { background-color: #fff7ed; padding: 14px 16px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
    .unsubscribe { font-size: 11px; color: #999; margin-top: 20px; }
  `;

  const baseTemplate = (title: string, content: string) => `
    <!DOCTYPE html>
    <html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>${title}</title>
      <style>${styles}</style>
    </head><body>
      <div class="header"><h2>${title}</h2></div>
      <div class="content">${content}</div>
      <div class="footer">
        <p>This is an automated message from the Action Central system.</p>
        <p>Platinum Credit Limited</p>
        <p class="unsubscribe">Please do not reply to this email — replies are not monitored.</p>
      </div>
    </body></html>
  `;

  const descRaw = String(action.description ?? "");
  const desc = esc(descRaw);
  const shortDesc = descRaw.substring(0, 50) + (descRaw.length > 50 ? '...' : '');
  const dept = esc(action.department);
  const pri = esc(action.priority);
  const priClass = esc(String(action.priority ?? "").replace(/[^a-z0-9-]/gi, ""));
  const due = esc(formatDate(action.dueDate));
  const progress = esc(action.progressStatus);
  const notesHtml = action.notes ? `<p><strong>Notes:</strong> ${esc(action.notes)}</p>` : '';
  const notesText = action.notes ? `Notes: ${String(action.notes)}` : '';

  const acceptRejectCta = opts.isOwner && opts.acceptUrl && opts.rejectUrl ? `
    <div class="cta-wrap">
      <a class="cta-btn" style="background:#16a34a;margin-right:8px" href="${esc(opts.acceptUrl)}">Accept task</a>
      <a class="cta-btn" style="background:#dc2626" href="${esc(opts.rejectUrl)}">Reject task</a>
    </div>
  ` : '';

  const ownerCta = opts.isOwner && opts.updateUrl ? `
    ${acceptRejectCta}
    <div class="cta-wrap">
      <a class="cta-btn" href="${esc(opts.updateUrl)}">Update this action</a>
    </div>
    <div class="info-box">
      <p style="margin:0"><strong>Only you (the action owner) can act on this item.</strong> Use the secure buttons above — the link expires in 30 days. A calendar invite (invite.ics) is attached so you can add it to your calendar. Replying to this email will not update the action.</p>
    </div>
  ` : '';

  const followerNotice = !opts.isOwner ? `
    <div class="viewer-box">
      <p style="margin:0"><strong>You are receiving this as a follower (CC/BCC).</strong> A calendar invite (invite.ics) is attached for your awareness. Only the action owner (${esc(action.ownerEmail)}) can update its progress. Replying to this email will not change the action.</p>
    </div>
  ` : '';


  let titleVerb = "";
  let intro = "";
  let subjectPrefix = "";

  switch (type) {
    case "assigned":
      titleVerb = `New Action Item Assigned: ${shortDesc}`;
      intro = opts.isOwner
        ? `<p>Hello,</p><p>You've been assigned a new action item in Action Central.</p>`
        : `<p>Hello,</p><p>A new action item has been assigned to <strong>${esc(action.ownerEmail)}</strong>. You are being notified as a follower.</p>`;
      break;
    case "updated":
      titleVerb = `Action Item Updated: ${shortDesc}`;
      intro = opts.isOwner
        ? `<p>Hello,</p><p>An action item assigned to you has been updated.</p>`
        : `<p>Hello,</p><p>An action item owned by <strong>${esc(action.ownerEmail)}</strong> has been updated.</p>`;
      break;
    case "due_soon":
      titleVerb = `REMINDER: Action Item Due Soon: ${shortDesc}`;
      intro = opts.isOwner
        ? `<p>Hello,</p><p>This is a reminder that you have an action item due soon.</p>`
        : `<p>Hello,</p><p>An action item owned by <strong>${esc(action.ownerEmail)}</strong> is due soon.</p>`;
      break;
    case "overdue":
      titleVerb = `OVERDUE: Action Item Past Due Date: ${shortDesc}`;
      intro = opts.isOwner
        ? `<p>Hello,</p><p>An action item assigned to you is now overdue.</p>`
        : `<p>Hello,</p><p>An action item owned by <strong>${esc(action.ownerEmail)}</strong> is now overdue.</p>`;
      break;
    default:
      titleVerb = `Action Central: ${shortDesc}`;
      intro = `<p>Hello,</p><p>There's been an update to an action item.</p>`;
  }

  if (!opts.isOwner) subjectPrefix = "[FYI] ";

  const subject = `${subjectPrefix}${titleVerb}`;

  const details = `
    <h3>${desc}</h3>
    <p><strong>Department:</strong> ${dept}</p>
    <p><strong>Priority:</strong> <span class="priority-${priClass}">${pri}</span></p>
    <p><strong>Due Date:</strong> ${due}</p>
    <p><strong>Current Progress:</strong> ${progress}</p>
    ${notesHtml}
  `;

  const content = `${intro}${details}${ownerCta}${followerNotice}`;

  const plainText = `
${opts.isOwner ? '' : '[FYI] '}${titleVerb}

${descRaw}

Department: ${action.department}
Priority: ${action.priority}
Due Date: ${formatDate(action.dueDate)}
Current Progress: ${action.progressStatus}
${notesText}

${opts.isOwner
  ? `Only you (the action owner) can update this action. Use the secure link below (expires in 14 days, single-use):\n${opts.updateUrl}\n\nReplying to this email will NOT update the action.`
  : `You are receiving this as a follower (CC/BCC). Only the action owner (${action.ownerEmail}) can update progress. Replying to this email will not change the action.`}

This is an automated message from the Action Central system.
Platinum Credit Limited
  `.trim();

  return {
    subject,
    htmlContent: baseTemplate(subject, content),
    textContent: plainText,
  };
}
