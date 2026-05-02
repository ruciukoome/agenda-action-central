import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, organizationId, role } = await req.json();
    if (!email || !organizationId || !['admin', 'member'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin of this org (or super_admin)
    const { data: roleRow } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    const { data: superAdminRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if ((!roleRow || roleRow.role !== 'admin') && !superAdminRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email via admin API
    const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    const target = usersList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (target) {
      // Check if already a member of this org
      const { data: existing } = await admin
        .from('organization_members')
        .select('id')
        .eq('user_id', target.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: 'User is already a member of this organization' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: insertErr } = await admin
        .from('organization_members')
        .insert({ organization_id: organizationId, user_id: target.id, role });

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ success: true, status: 'added', userId: target.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No user yet — create a pending invitation
    const { error: invErr } = await admin
      .from('pending_invitations')
      .upsert(
        {
          organization_id: organizationId,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
          accepted_at: null,
        },
        { onConflict: 'organization_id,email' }
      );

    if (invErr) throw invErr;

    return new Response(JSON.stringify({ success: true, status: 'invited' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('invite-org-member error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
