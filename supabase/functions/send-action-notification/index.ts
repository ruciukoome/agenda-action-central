/**
 * EDGE FUNCTION: ACTION NOTIFICATION SENDER
 * ----------------------------------------
 * Sends notification emails for action items.
 * - Owner receives a secure, one-time update link + Accept/Reject buttons.
 * - CC/BCC recipients receive a separate "view-only" notification (no link).
 * - If the action is linked to a meeting, a shared ICS invite is attached.
 *   Multiple actions sharing the same meeting produce one calendar event
 *   (stable UID) with every action's owner/CC/BCC added as attendees.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType = "assigned" | "updated" | "due_soon" | "overdue" | "completed";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAuth = createClient(supabaseUrl, anonKey);
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
    const payload = await req.json();
    const { action, type, ccEmails = [], bccEmails = [], senderEmail, actionToken } = payload as {
      action: any; type: NotificationType; ccEmails?: string[]; bccEmails?: string[];
      senderEmail?: string; actionToken?: string;
    };

    if (!action || !action.ownerEmail || !action.id) {
      throw new Error("Missing required data: action, action.id, or owner email");
    }

    // Auth: normally require a Bearer JWT. For type="completed" allow an unauthenticated
    // call when accompanied by a valid unused action token (used by the public UpdateTask page).
    const authHeader = req.headers.get("Authorization") || "";
    const hasBearer = authHeader.toLowerCase().startsWith("bearer ");
    let authorized = false;
    let callerId: string | null = null;

    if (hasBearer) {
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      const { data: claims, error: authError } = await supabaseAuth.auth.getClaims(jwt);
      if (!authError && claims?.claims?.sub) {
        authorized = true;
        callerId = claims.claims.sub as string;
      }
    }

    let tokenAuthorized = false;
    if (!authorized && type === "completed" && actionToken) {
      const { data: tokens } = await supabaseAdmin.rpc("get_action_token_by_id_and_token", {
        p_action_id: action.id, p_token: actionToken,
      });
      if (tokens && (Array.isArray(tokens) ? tokens.length > 0 : true)) {
        authorized = true;
        tokenAuthorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ownership check: if authenticated via JWT, the caller must own the action
    // (user_id) or be an admin of the action's organization. This prevents cross-tenant
    // token forging via arbitrary action.id in the request body.
    if (callerId && !tokenAuthorized) {
      const { data: actionOwnership, error: ownErr } = await supabaseAdmin
        .from("actions")
        .select("user_id, organization_id")
        .eq("id", action.id)
        .maybeSingle();

      if (ownErr || !actionOwnership) {
        return new Response(JSON.stringify({ success: false, error: "Action not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let allowed = (actionOwnership as any).user_id === callerId;
      if (!allowed && (actionOwnership as any).organization_id) {
        const { data: role } = await supabaseAdmin.rpc("get_user_org_role", {
          _user_id: callerId,
          _org_id: (actionOwnership as any).organization_id,
        });
        if (role === "admin") allowed = true;
      }

      if (!allowed) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ===== Preference gating: skip silently if the assigner has disabled this type =====
    const prefKey =
      type === "completed" ? "completion_updates"
      : (type === "assigned" || type === "updated") ? "assignment_notifications"
      : null;

    if (prefKey) {
      try {
        const { data: actionRow } = await supabaseAdmin
          .from("actions")
          .select("user_id, organization_id")
          .eq("id", action.id)
          .maybeSingle();
        if (actionRow) {
          const { data: allowed } = await supabaseAdmin.rpc("get_effective_email_pref", {
            _user_id: (actionRow as any).user_id,
            _org_id: (actionRow as any).organization_id,
            _key: prefKey,
          });
          if (allowed === false) {
            console.log(`[pref] Skipping ${type} email for action ${action.id} (${prefKey} disabled)`);
            return new Response(
              JSON.stringify({ success: true, skipped: true, reason: `${prefKey} disabled` }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (e) {
        console.warn("[pref] Failed to check email preference, proceeding:", e);
      }
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

    const FROM_ADDRESS = "Action Central <info@nafarrosolutions.com>";
    const FALLBACK_REPLY_TO = "info@nafarrosolutions.com";
    const isValidEmail = (e?: string) => typeof e === "string" && /.+@.+\..+/.test(e);

    // ===== Completion notification: email the assigner only =====
    if (type === "completed") {
      // Look up assigner (action.user_id) email
      let assignerEmail: string | undefined;
      const { data: actionRow } = await supabaseAdmin
        .from("actions").select("user_id").eq("id", action.id).maybeSingle();
      const assignerId = (actionRow as any)?.user_id;
      if (assignerId) {
        const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(assignerId);
        assignerEmail = userRes?.user?.email ?? undefined;
      }
      if (!isValidEmail(assignerEmail)) {
        return new Response(JSON.stringify({ success: false, error: "Assigner email not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const shortDesc = String(action.description ?? "").substring(0, 50);
      const subject = `Action completed by ${action.ownerEmail}: ${shortDesc}`;
      const html = `
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
          <div style="background:#16a34a;color:#fff;padding:20px;text-align:center;"><h2>Action Completed</h2></div>
          <div style="padding:24px;">
            <p>Hello,</p>
            <p><strong>${esc(action.ownerEmail)}</strong> has marked the following action as complete:</p>
            <h3>${esc(action.description)}</h3>
            <p><strong>Department:</strong> ${esc(action.department)}</p>
            <p><strong>Priority:</strong> ${esc(action.priority)}</p>
            <p><strong>Progress:</strong> ${esc(action.progressStatus)}</p>
            ${action.notes ? `<p><strong>Notes:</strong> ${esc(action.notes)}</p>` : ""}
            <p><strong>Completed at:</strong> ${esc(new Date().toLocaleString())}</p>
            <p style="margin-top:20px;font-size:12px;color:#666;">Replying to this email will go directly to ${esc(action.ownerEmail)}.</p>
          </div>
        </body></html>`;
      const text = `${action.ownerEmail} marked the action "${action.description}" as complete.\nProgress: ${action.progressStatus}\n${action.notes ? `Notes: ${action.notes}\n` : ""}Completed at: ${new Date().toLocaleString()}`;

      const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [assignerEmail],
          reply_to: isValidEmail(action.ownerEmail) ? action.ownerEmail : FALLBACK_REPLY_TO,
          subject, html, text,
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Resend (completion) error: ${resp.status} - ${t}`);
      }
      return new Response(JSON.stringify({ success: true, message: "Completion notification sent", assignerEmail }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const replyTo = isValidEmail(senderEmail) ? senderEmail! : FALLBACK_REPLY_TO;


    // ---- Generate secure token for owner (update + accept/reject) ----
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

    // ---- Optional meeting -> shared ICS invite ----
    let icsAttachment: { filename: string; content: string; content_type: string } | null = null;
    let meetingForEmail: any = null;

    const meetingId = action.meetingId ?? action.meeting_id ?? null;
    if (meetingId) {
      const { data: meeting } = await supabaseAdmin
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .maybeSingle();

      if (meeting) {
        meetingForEmail = meeting;

        // Collect attendees from every action attached to this meeting
        const { data: siblingActions } = await supabaseAdmin
          .from("actions")
          .select("owner_email, description")
          .eq("meeting_id", meetingId);

        const collected: string[] = [];
        for (const a of (siblingActions || []) as any[]) {
          if (a.owner_email) collected.push(a.owner_email);
        }
        // Include the current request's recipients (covers create-flow timing
        // and CC/BCC which aren't persisted on the row).
        collected.push(action.ownerEmail, ...(ccEmails || []), ...(bccEmails || []));

        const attendees = [...new Set(
          collected.filter((e) => typeof e === "string" && e.includes("@"))
        )];

        const actionDescriptions = ((siblingActions || []) as any[])
          .map((a) => `• ${a.description}`)
          .join("\n");

        const ics = buildMeetingIcs(meeting, attendees, actionDescriptions);
        icsAttachment = {
          filename: "invite.ics",
          content: btoa(unescape(encodeURIComponent(ics))),
          content_type: "text/calendar; method=REQUEST; charset=UTF-8",
        };
      } else {
        console.warn(`Meeting ${meetingId} referenced by action but not found.`);
      }
    }

    // ---- Owner email ----
    const ownerEmail = generateEmailContent(action, type, {
      isOwner: true, updateUrl, acceptUrl, rejectUrl, meeting: meetingForEmail, assignerEmail: senderEmail,
    });
    const ownerBody: Record<string, unknown> = {
      from: FROM_ADDRESS,
      to: [action.ownerEmail],
      reply_to: replyTo,
      subject: ownerEmail.subject,
      html: ownerEmail.htmlContent,
      text: ownerEmail.textContent,
    };
    if (icsAttachment) ownerBody.attachments = [icsAttachment];

    const ownerResp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ownerBody),
    });

    if (!ownerResp.ok) {
      const t = await ownerResp.text();
      throw new Error(`Resend (owner) error: ${ownerResp.status} - ${t}`);
    }

    // ---- Follower email (CC + BCC) ----
    const followers = [...new Set([...(ccEmails || []), ...(bccEmails || [])]
      .filter((e) => typeof e === "string" && e.includes("@") && e !== action.ownerEmail))];

    let followerCount = 0;
    if (followers.length > 0) {
      const followerEmail = generateEmailContent(action, type, { isOwner: false, meeting: meetingForEmail, assignerEmail: senderEmail });
      const followerBody: Record<string, unknown> = {
        from: FROM_ADDRESS,
        to: ["info@nafarrosolutions.com"],
        bcc: followers,
        reply_to: replyTo,
        subject: followerEmail.subject,
        html: followerEmail.htmlContent,
        text: followerEmail.textContent,
      };
      if (icsAttachment) followerBody.attachments = [icsAttachment];

      const followerResp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "X-Connection-Api-Key": resendApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(followerBody),
      });
      if (!followerResp.ok) {
        const t = await followerResp.text();
        console.error(`Resend (followers) error: ${followerResp.status} - ${t}`);
      } else {
        followerCount = followers.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent", ownerSent: true, followerCount, hasIcs: !!icsAttachment }),
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
  opts: { isOwner: boolean; updateUrl?: string; acceptUrl?: string; rejectUrl?: string; meeting?: any; assignerEmail?: string }
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
    .meeting-box { background-color: #ecfeff; padding: 14px 16px; border-left: 4px solid #06b6d4; margin: 20px 0; border-radius: 4px; }
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
        <p class="unsubscribe">Replies to this email will go to the person who assigned this action.</p>
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

  const meetingHtml = opts.meeting ? `
    <div class="meeting-box">
      <p style="margin:0 0 6px"><strong>📅 ${esc(opts.meeting.title)}</strong></p>
      <p style="margin:0">${esc(new Date(opts.meeting.start_at).toLocaleString())} – ${esc(new Date(opts.meeting.end_at).toLocaleString())} (${esc(opts.meeting.timezone || 'UTC')})</p>
      ${opts.meeting.location ? `<p style="margin:6px 0 0"><strong>Where:</strong> ${esc(opts.meeting.location)}</p>` : ''}
      ${opts.meeting.description ? `<p style="margin:6px 0 0">${esc(opts.meeting.description)}</p>` : ''}
      <p style="margin:8px 0 0;font-size:12px;color:#475569">A calendar invite (invite.ics) is attached.</p>
    </div>
  ` : '';

  const ownerCta = opts.isOwner && opts.updateUrl ? `
    ${acceptRejectCta}
    <div class="cta-wrap">
      <a class="cta-btn" href="${esc(opts.updateUrl)}">Update this action</a>
    </div>
    <div class="info-box">
      <p style="margin:0"><strong>Only you (the action owner) can act on this item.</strong> Use the secure buttons above — the link expires in 30 days. Replies to this email will go to the person who assigned it${opts.assignerEmail ? ` (${esc(opts.assignerEmail)})` : ''}, not to update the action.</p>
    </div>
  ` : '';

  const followerNotice = !opts.isOwner ? `
    <div class="viewer-box">
      <p style="margin:0"><strong>You are receiving this as a follower (CC/BCC).</strong> Only the action owner (${esc(action.ownerEmail)}) can update its progress. Replying to this email will not change the action.</p>
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

  const content = `${intro}${meetingHtml}${details}${ownerCta}${followerNotice}`;

  const plainText = `
${opts.isOwner ? '' : '[FYI] '}${titleVerb}

${descRaw}

Department: ${action.department}
Priority: ${action.priority}
Due Date: ${formatDate(action.dueDate)}
Current Progress: ${action.progressStatus}
${notesText}

${opts.meeting ? `Meeting: ${opts.meeting.title} — ${new Date(opts.meeting.start_at).toLocaleString()} to ${new Date(opts.meeting.end_at).toLocaleString()} (${opts.meeting.timezone || 'UTC'})\n` : ''}
${opts.isOwner
  ? `Only you (the action owner) can update this action. Use the secure link below (expires in 30 days, single-use):\n${opts.updateUrl}\n\nReplying to this email will NOT update the action.`
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

// ---- ICS calendar invite builder, keyed by meeting UID for sharing ----
function buildMeetingIcs(meeting: any, attendees: string[], actionList: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const icsEscape = (s: string) =>
    String(s ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const fold = (line: string) => {
    const out: string[] = [];
    let l = line;
    while (l.length > 73) {
      out.push(l.slice(0, 73));
      l = " " + l.slice(73);
    }
    out.push(l);
    return out.join("\r\n");
  };

  const start = new Date(meeting.start_at);
  const end = new Date(meeting.end_at);

  const summary = meeting.title || "Action Central meeting";
  const descParts = [
    meeting.description || "",
    actionList ? `\nAction items:\n${actionList}` : "",
  ].filter(Boolean).join("\n");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Action Central//EN",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${meeting.ics_uid || `meeting-${meeting.id}@actioncentral`}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(descParts)}`,
    meeting.location ? `LOCATION:${icsEscape(meeting.location)}` : "",
    `ORGANIZER;CN=Action Central:mailto:info@nafarrosolutions.com`,
    ...attendees.map(
      (a) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${a}:mailto:${a}`
    ),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(fold).join("\r\n");
}
