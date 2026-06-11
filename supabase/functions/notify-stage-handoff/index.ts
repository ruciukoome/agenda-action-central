/**
 * notify-stage-handoff
 * Triggered (via pg_net from a DB trigger) when a stage completes and the next is unlocked.
 * Emails the next stage owner (assignment-style) and CCs the project owner.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { project_id, completed_stage_id, next_stage_id } = await req.json();
    if (!project_id || !next_stage_id) {
      return new Response(JSON.stringify({ error: "Missing IDs" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: project }, { data: nextStage }, { data: prevStage }] = await Promise.all([
      supabaseAdmin.from("collaborative_projects").select("*").eq("id", project_id).maybeSingle(),
      supabaseAdmin.from("project_stages").select("*").eq("id", next_stage_id).maybeSingle(),
      completed_stage_id
        ? supabaseAdmin.from("project_stages").select("*").eq("id", completed_stage_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!project || !nextStage) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableApiKey || !resendApiKey) {
      console.error("Missing email keys");
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `It's your turn: ${project.title} — Stage ${nextStage.sequence}`;
    const ccList = project.owner_email && project.owner_email !== nextStage.owner_email
      ? [project.owner_email] : [];

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
      <div style="background:#0284c7;color:#fff;padding:20px;text-align:center;"><h2>Stage Handoff</h2></div>
      <div style="padding:24px;">
        <p>Hi,</p>
        <p><strong>${esc(prevStage?.owner_email ?? "The previous stage owner")}</strong> has completed
          ${prevStage ? `<em>Stage ${prevStage.sequence}: ${esc(prevStage.title)}</em>` : "their stage"}.
          You're up next on <strong>${esc(project.title)}</strong>.</p>
        <div style="background:#f1f5f9;padding:14px 16px;border-left:4px solid #0284c7;margin:16px 0;border-radius:4px;">
          <p style="margin:0 0 6px 0;"><strong>Stage ${nextStage.sequence}:</strong> ${esc(nextStage.title)}</p>
          ${nextStage.skill_required ? `<p style="margin:0 0 6px 0;"><strong>Skill needed:</strong> ${esc(nextStage.skill_required)}</p>` : ""}
          <p style="margin:0;"><strong>Planned end:</strong> ${esc(nextStage.planned_end_date ?? "—")}</p>
        </div>
        <p>Open ActionsPoint to update progress as you go. When you mark this stage 100%, the next owner will be notified automatically.</p>
      </div>
    </body></html>`;

    const resp = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Action Central <info@nafarrosolutions.com>",
        to: [nextStage.owner_email],
        cc: ccList,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Resend error:", resp.status, t);
      return new Response(JSON.stringify({ error: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("notify-stage-handoff error:", e);
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
