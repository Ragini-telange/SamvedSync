import { supabase } from '../supabaseClient';

// Calls the create-staff Edge Function with the current admin's access token.
// Used for both "Add Nurse" and "Add Doctor".
export async function createStaffAccount(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in.');

  const { data, error } = await supabase.functions.invoke('create-staff', {
    body: payload,
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  if (error) {
    // supabase-js wraps non-2xx responses in error; try to surface the real message
    const message = data?.message || error.message || 'Failed to create account.';
    throw new Error(message);
  }
  if (data?.success === false) {
    throw new Error(data.message || 'Failed to create account.');
  }
  return data;
}
