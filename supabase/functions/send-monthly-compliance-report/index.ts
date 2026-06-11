/**
 * EDGE FUNCTION: MONTHLY COMPLIANCE REPORT
 * ----------------------------------------
 * Sends each opted-in org admin a monthly report of compliant vs non-compliant
 * users for actions due in the previous month.
 *
 * Compliance rule (configurable per org via organization_email_settings.compliance_rule):
 *  - 'on_time' (default): owner is COMPLIANT only if every action due in the month
 *    was completed on or before its due_date.
 *  - 'any_completion': owner is COMPLIANT if every action due in the month was
 *    completed at all (even late). Only still-open actions count against them.
 *
 * Triggered by pg_cron on the 1st of each month, secured via CRON_SECRET.
 * Can also be invoked manually by an org admin to preview (?orgId=&month=YYYY-MM).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const FROM_ADDRESS = "Action Central <info@nafarrosolutions.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ComplianceRule = "on_time" | "any_completion";

interface OwnerStat {
  email: string;
  total: number;
  completedOnTime: number;
  overdue: number;
  incomplete: number;
  compliant: boolean;
}

function getPreviousMonthRange(now = new Date()): { start: Date; end: Date; label: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start, end, label };
}

function parseMonthParam(month: string | null): { start: Date; end: Date; label: string } | null {
  if (!month) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]) - 1;
  const start = new Date(Date.UTC(year, mon, 1));
  const end = new Date(Date.UTC(year, mon + 1, 1));
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start, end, label };
}

function ruleLabel(rule: ComplianceRule): string {
  return rule === "any_completion"
    ? "any completion (even after the due date) counts as compliant"
    : "completion on or before the due date";
}

async function getOrgComplianceRule(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
): Promise<ComplianceRule> {
  const { data } = await supabase
    .from("organization_email_settings")
    .select("compliance_rule")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const v = (data as any)?.compliance_rule;
  return v === "any_completion" ? "any_completion" : "on_time";
}

async function computeOrgStats(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  start: Date,
  end: Date,
  rule: ComplianceRule,
): Promise<{ owners: OwnerStat[]; compliantCount: number; nonCompliantCount: number; totalActions: number }> {
  const { data: actions, error } = await supabase
    .from("actions")
    .select("id, owner_email, due_date, completed, updated_at, progress_status, description")
    .eq("organization_id", organizationId)
    .gte("due_date", start.toISOString())
    .lt("due_date", end.toISOString());

  if (error) throw new Error(`Failed to query actions: ${error.message}`);

  const now = new Date();
  const byOwner = new Map<string, OwnerStat>();

  for (const a of actions || []) {
    const email = (a.owner_email || "").toLowerCase().trim();
    if (!email) continue;
    const due = a.due_date ? new Date(a.due_date) : null;
    if (!due) continue;

    let stat = byOwner.get(email);
    if (!stat) {
      stat = { email, total: 0, completedOnTime: 0, overdue: 0, incomplete: 0, compliant: true };
      byOwner.set(email, stat);
    }
    stat.total += 1;

    if (a.completed) {
      const completedAt = a.updated_at ? new Date(a.updated_at) : null;
      const onTime = completedAt && completedAt <= due;
      if (rule === "any_completion") {
        // Any completion counts as on-time for compliance purposes
        stat.completedOnTime += 1;
      } else if (onTime) {
        stat.completedOnTime += 1;
      } else {
        stat.overdue += 1;
      }
    } else {
      if (due < now) {
        stat.overdue += 1;
      } else {
        stat.incomplete += 1;
      }
    }
  }

  let compliantCount = 0;
  let nonCompliantCount = 0;
  const owners: OwnerStat[] = [];
  for (const s of byOwner.values()) {
    s.compliant = s.overdue === 0 && s.incomplete === 0;
    if (s.compliant) compliantCount++;
    else nonCompliantCount++;
    owners.push(s);
  }
  owners.sort((a, b) => Number(a.compliant) - Number(b.compliant) || a.email.localeCompare(b.email));

  return {
    owners,
    compliantCount,
    nonCompliantCount,
    totalActions: (actions || []).length,
  };
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(opts: {
  orgName: string;
  monthLabel: string;
  owners: OwnerStat[];
  compliantCount: number;
  nonCompliantCount: number;
  totalActions: number;
  rule: ComplianceRule;
}): { html: string; text: string; subject: string } {
  const { orgName, monthLabel, owners, compliantCount, nonCompliantCount, totalActions, rule } = opts;
  const totalUsers = owners.length;
  const rate = totalUsers > 0 ? Math.round((compliantCount / totalUsers) * 100) : 0;

  const subject = `${monthLabel} Compliance Report — ${orgName}`;

  const rowsHtml = owners.length
    ? owners
        .map(
          (o) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${esc(o.email)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${o.total}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#16a34a;">${o.completedOnTime}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;">${o.overdue}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#d97706;">${o.incomplete}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">
            <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;${
              o.compliant
                ? "background:#dcfce7;color:#166534;"
                : "background:#fee2e2;color:#991b1b;"
            }">${o.compliant ? "Compliant" : "Non-compliant"}</span>
          </td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="6" style="padding:16px;text-align:center;color:#666;">No actions were due in ${esc(monthLabel)}.</td></tr>`;

  const onTimeHeader = rule === "any_completion" ? "Completed" : "On time";

  const html = `
  <!DOCTYPE html>
  <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(subject)}</title></head>
  <body style="font-family:Arial,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;padding:0;background:#f9fafb;">
    <div style="background:#0070f3;color:#fff;padding:20px;text-align:center;">
      <h2 style="margin:0;">Monthly Compliance Report</h2>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">${esc(orgName)} — ${esc(monthLabel)}</p>
    </div>
    <div style="padding:20px;background:#ffffff;">
      <p>Hello,</p>
      <p>Below is the compliance summary of action items <strong>due in ${esc(monthLabel)}</strong> for your organization.</p>
      <p style="font-size:12px;color:#6b7280;margin-top:-6px;">
        Compliance rule: <strong>${esc(ruleLabel(rule))}</strong>.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr>
          <td style="padding:12px;background:#f3f4f6;border-radius:6px;text-align:center;">
            <div style="font-size:22px;font-weight:700;">${totalActions}</div>
            <div style="font-size:12px;color:#6b7280;">Actions due</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#dcfce7;border-radius:6px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#166534;">${compliantCount}</div>
            <div style="font-size:12px;color:#166534;">Compliant users</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#fee2e2;border-radius:6px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#991b1b;">${nonCompliantCount}</div>
            <div style="font-size:12px;color:#991b1b;">Non-compliant users</div>
          </td>
          <td style="width:8px;"></td>
          <td style="padding:12px;background:#dbeafe;border-radius:6px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#1e40af;">${rate}%</div>
            <div style="font-size:12px;color:#1e40af;">Compliance rate</div>
          </td>
        </tr>
      </table>

      <h3 style="margin-top:24px;margin-bottom:8px;">Per-user breakdown</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px;text-align:left;">User</th>
            <th style="padding:8px;">Actions</th>
            <th style="padding:8px;">${onTimeHeader}</th>
            <th style="padding:8px;">${rule === "any_completion" ? "Late (info)" : "Overdue / late"}</th>
            <th style="padding:8px;">Still open</th>
            <th style="padding:8px;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        Compliant = every action due in ${esc(monthLabel)} satisfied the org's rule (${esc(ruleLabel(rule))}).
        Org admins can change this in Settings → Email Notifications.
      </p>

      <p style="margin-top:16px;">
        <a href="https://actioncentral.platinumcredit.co.ke/compliance-report" style="background:#0070f3;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">View in Action Central</a>
      </p>
    </div>
    <div style="padding:16px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #eee;background:#fafafa;">
      Automated monthly report from Action Central. You can disable this in Settings → Email Notifications.
    </div>
  </body></html>`;

  const lines = [
    `${monthLabel} Compliance Report — ${orgName}`,
    `Rule: ${ruleLabel(rule)}`,
    ``,
    `Actions due: ${totalActions}`,
    `Compliant users: ${compliantCount}`,
    `Non-compliant users: ${nonCompliantCount}`,
    `Compliance rate: ${rate}%`,
    ``,
    `Per-user breakdown:`,
    ...owners.map(
      (o) =>
        `- ${o.email}: ${o.total} actions, ${o.completedOnTime} ${rule === "any_completion" ? "completed" : "on time"}, ${o.overdue} overdue/late, ${o.incomplete} open — ${o.compliant ? "Compliant" : "Non-compliant"}`,
    ),
  ];

  return { subject, html, text: lines.join("\n") };
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": resendApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: "info@nafarrosolutions.com",
      subject,
      html,
      text,
    }),
  });
  const body = await resp.text();
  if (!resp.ok) throw new Error(`Resend error ${resp.status}: ${body}`);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const previewOrgId = url.searchParams.get("orgId");
  const previewMonth = url.searchParams.get("month");

  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");
  const isCronCall = !!cronSecret && provided === cronSecret;

  let callerUserId: string | null = null;
  if (!isCronCall) {
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerUserId = user.id;
  }

  try {
    const range = parseMonthParam(previewMonth) ?? getPreviousMonthRange();

    if (!isCronCall) {
      if (!previewOrgId) {
        return new Response(JSON.stringify({ error: "orgId required for preview" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: mem } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", previewOrgId)
        .eq("user_id", callerUserId!)
        .maybeSingle();
      const { data: superRow } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", callerUserId!)
        .eq("role", "super_admin")
        .maybeSingle();
      const isAdmin = mem?.role === "admin" || !!superRow;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", previewOrgId)
        .maybeSingle();

      const rule = await getOrgComplianceRule(supabase, previewOrgId);
      const stats = await computeOrgStats(supabase, previewOrgId, range.start, range.end, rule);
      return new Response(
        JSON.stringify({
          organization: org,
          month: range.label,
          monthStart: range.start.toISOString(),
          monthEnd: range.end.toISOString(),
          complianceRule: rule,
          ...stats,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: orgs, error: orgsErr } = await supabase
      .from("organizations")
      .select("id, name");
    if (orgsErr) throw orgsErr;

    const results: any[] = [];

    for (const org of orgs || []) {
      const { data: admins } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .eq("role", "admin");

      if (!admins || admins.length === 0) continue;

      const recipientUserIds: string[] = [];
      for (const a of admins) {
        const { data: allowed } = await supabase.rpc("get_effective_email_pref", {
          _user_id: a.user_id,
          _org_id: org.id,
          _key: "monthly_compliance_report",
        });
        if (allowed === true) recipientUserIds.push(a.user_id);
      }
      if (recipientUserIds.length === 0) continue;

      const emailById = new Map<string, string>();
      let page = 1;
      while (page <= 5) {
        const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        data.users.forEach((u) => {
          if (recipientUserIds.includes(u.id) && u.email) emailById.set(u.id, u.email);
        });
        if (data.users.length < 1000) break;
        page++;
      }

      const rule = await getOrgComplianceRule(supabase, org.id);
      const stats = await computeOrgStats(supabase, org.id, range.start, range.end, rule);
      const { subject, html, text } = buildEmail({
        orgName: org.name,
        monthLabel: range.label,
        rule,
        ...stats,
      });

      for (const uid of recipientUserIds) {
        const email = emailById.get(uid);
        if (!email) continue;
        try {
          await sendEmail(email, subject, html, text);
          results.push({ orgId: org.id, to: email, status: "sent", rule });
        } catch (e: any) {
          results.push({ orgId: org.id, to: email, status: "error", error: e?.message });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, month: range.label, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("send-monthly-compliance-report error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
