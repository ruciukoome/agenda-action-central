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
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is super_admin
    const { data: superRow } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!superRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all auth users (paginate up to 5 pages of 1000)
    const allUsers: Array<{ id: string; email: string | null; created_at: string; last_sign_in_at: string | null }> = [];
    for (let page = 1; page <= 5; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      data.users.forEach((u) => {
        allUsers.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        });
      });
      if (data.users.length < 1000) break;
    }

    // Fetch all platform roles
    const { data: roles } = await admin
      .from('user_roles')
      .select('id, user_id, role, created_at');

    // Fetch all profiles for full_name
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url');

    // Fetch org memberships for context
    const { data: memberships } = await admin
      .from('organization_members')
      .select('user_id, role, organization_id, organizations(name, slug)');

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const rolesByUser = new Map<string, Array<{ id: string; role: string; created_at: string }>>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push({ id: r.id, role: r.role, created_at: r.created_at });
      rolesByUser.set(r.user_id, arr);
    });
    const orgsByUser = new Map<string, Array<{ org_id: string; org_name: string; org_slug: string; role: string }>>();
    (memberships ?? []).forEach((m: any) => {
      const arr = orgsByUser.get(m.user_id) ?? [];
      arr.push({
        org_id: m.organization_id,
        org_name: m.organizations?.name ?? '—',
        org_slug: m.organizations?.slug ?? '',
        role: m.role,
      });
      orgsByUser.set(m.user_id, arr);
    });

    const enriched = allUsers.map((u) => ({
      ...u,
      full_name: profileMap.get(u.id)?.full_name ?? null,
      avatar_url: profileMap.get(u.id)?.avatar_url ?? null,
      platform_roles: rolesByUser.get(u.id) ?? [],
      organizations: orgsByUser.get(u.id) ?? [],
    }));

    return new Response(JSON.stringify({ users: enriched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-list-users error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
