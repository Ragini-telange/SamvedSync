// ================================================
// supabase/functions/create-staff/index.ts
// ================================================
// Creates a new Auth user + profile + nurse/doctor row in
// one call. This must run server-side because creating an
// Auth user for someone else requires the service_role key,
// which must never be exposed to the browser.
//
// Hierarchy (v4):
//   Doctor caller → can create role 'nurse' or 'admin'
//   Admin  caller → can create role 'nurse' only
//   Anyone else   → rejected
//
// Deploy with: supabase functions deploy create-staff
// Call from the app with the caller's session token in the
// Authorization header — this function checks the caller's
// real role (from the profiles table) before doing anything.
// ================================================
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Client the caller authenticated with (respects RLS) — used only to verify who's calling
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return json({ success: false, message: 'Not authenticated.' }, 401);
    }

    const { data: callerProfile } = await callerClient
      .from('profiles').select('role').eq('id', caller.id).single();
    const callerRole = callerProfile?.role;
    if (callerRole !== 'admin' && callerRole !== 'doctor') {
      return json({ success: false, message: 'Only admins or doctors can create staff accounts.' }, 403);
    }

    const body = await req.json();
    const { name, username, email, password, role } = body;
    if (!name || !username || !email || !password || !role) {
      return json({ success: false, message: 'name, username, email, password, role are all required.' }, 400);
    }
    if (!['nurse', 'doctor', 'admin'].includes(role)) {
      return json({ success: false, message: 'role must be nurse, doctor, or admin.' }, 400);
    }
    // Admins may only create nurses. Doctors may create nurses or admins.
    // Nobody creates a 'doctor' account through the app (set up manually in Supabase).
    if (role === 'doctor') {
      return json({ success: false, message: 'Doctor accounts cannot be created from the app.' }, 403);
    }
    if (callerRole === 'admin' && role !== 'nurse') {
      return json({ success: false, message: 'Admins can only create nurse accounts.' }, 403);
    }
    if (password.length < 5 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return json({ success: false, message: 'Password must be 5+ characters with a letter and a number.' }, 400);
    }

    // Admin client — service role bypasses RLS, required to create Auth users
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (createErr) return json({ success: false, message: createErr.message }, 400);

    const userId = created.user.id;

    const { error: profileErr } = await adminClient
      .from('profiles').insert({ id: userId, name, username, role });
    if (profileErr) {
      await adminClient.auth.admin.deleteUser(userId); // roll back
      return json({ success: false, message: profileErr.message }, 400);
    }

    if (role === 'nurse') {
      const { employee_id, phone, ward, shift } = body;
      await adminClient.from('nurses').insert({ profile_id: userId, employee_id, phone, ward, shift });
    } else if (role === 'doctor') {
      const { employee_id, phone, specialization } = body;
      await adminClient.from('doctors').insert({ profile_id: userId, employee_id, phone, specialization });
    }

    return json({ success: true, message: `${role} account created.`, user_id: userId });
  } catch (err) {
    return json({ success: false, message: err.message || 'Server error.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
