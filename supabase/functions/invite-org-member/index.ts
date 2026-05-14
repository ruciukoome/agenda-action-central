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

    const { email, organizationId, role, resend: isResend = false, invitationId } = await req.json();
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

    // Look up org name for the email
    const { data: orgRow } = await admin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle();
    const orgName = orgRow?.name || 'an organization';

    // Send invitation email via Resend (Lovable connector gateway)
    let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
    let emailError: string | undefined;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (lovableApiKey && resendApiKey) {
      try {
        const appUrl = req.headers.get('origin') || 'https://actioncentral.platinumcredit.co.ke';
        const subject = `You're invited to join ${orgName} on ActionPoint`;
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
            <div style="background-color:#0070f3;color:white;padding:20px;text-align:center;">
              <h2 style="margin:0;">You've been invited to ActionPoint</h2>
            </div>
            <div style="padding:20px;">
              <p>Hello,</p>
              <p><strong>${user.email}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong> on ActionPoint.</p>
              <p>To accept this invitation, please sign up using this email address (<strong>${email}</strong>). You'll be added to the organization automatically when you create your account.</p>
              <p style="margin:24px 0;">
                <a href="${appUrl}" style="background-color:#0070f3;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Sign up to ActionPoint</a>
              </p>
              <p style="font-size:12px;color:#666;border-top:1px solid #eee;padding-top:15px;margin-top:30px;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;
        const text = `${user.email} invited you to join ${orgName} as a ${role} on ActionPoint.\n\nSign up at ${appUrl} using ${email} and you'll be added to the organization automatically.`;

        const resendRes = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'X-Connection-Api-Key': resendApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ActionPoint <info@nafarrosolutions.com>',
            to: [email],
            reply_to: 'info@nafarrosolutions.com',
            subject,
            html,
            text,
          }),
        });
        const resendText = await resendRes.text();
        console.log('Resend invite response:', resendRes.status, resendText);
        if (!resendRes.ok) {
          emailStatus = 'failed';
          emailError = `Resend ${resendRes.status}: ${resendText}`;
        } else {
          emailStatus = 'sent';
        }
      } catch (e) {
        emailStatus = 'failed';
        emailError = (e as Error).message;
        console.error('Invitation email error:', e);
      }
    } else {
      console.warn('LOVABLE_API_KEY or RESEND_API_KEY missing — skipping invitation email');
    }

    return new Response(
      JSON.stringify({ success: true, status: 'invited', email: emailStatus, emailError }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('invite-org-member error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
