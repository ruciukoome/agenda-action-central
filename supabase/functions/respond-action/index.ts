/**
 * EDGE FUNCTION: RESPOND TO ACTION (Accept / Reject)
 * Validates a tokenized response from the action owner and records the response.
 * Public endpoint (token-gated, no JWT required).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { actionId, token, decision } = await req.json();

    if (!actionId || !token || !["accept", "reject"].includes(decision)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing or invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token via existing RPC (checks expires_at + used=false)
    const { data: tokens, error: tokenErr } = await supabaseAdmin.rpc(
      "get_action_token_by_id_and_token",
      { p_action_id: actionId, p_token: token }
    );

    if (tokenErr || !tokens || (Array.isArray(tokens) && tokens.length === 0)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid, expired, or used token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = decision === "accept" ? "accepted" : "rejected";

    const updatePayload: Record<string, unknown> = {
      owner_response: response,
      owner_responded_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabaseAdmin
      .from("actions")
      .update(updatePayload)
      .eq("id", actionId);

    if (updErr) throw new Error(`Failed to update action: ${updErr.message}`);

    // Mark token used so it can't be replayed (one-shot for accept/reject)
    await supabaseAdmin
      .from("action_tokens")
      .update({ used: true })
      .eq("action_id", actionId)
      .eq("token", token);

    return new Response(
      JSON.stringify({ success: true, decision: response }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("respond-action error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
