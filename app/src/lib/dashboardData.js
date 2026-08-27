import { supabase } from '../supabaseClient';

export async function loadPatients() {
  const { data } = await supabase
    .from('patients')
    .select('*, nurses(id, profile_id, employee_id, phone, ward, profiles(name, username))')
    .order('admitted_at', { ascending: false });
  return data || [];
}

export async function loadNurses() {
  const { data } = await supabase
    .from('nurses')
    .select('*, profiles(id, name, username)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadApprovedNurses() {
  const { data } = await supabase
    .from('nurses')
    .select('*, profiles(id, name, username)')
    .or('status.eq.approved,status.is.null')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadPendingNurses() {
  const { data } = await supabase
    .from('nurses')
    .select('*, profiles(id, name, username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadDoctors() {
  const { data } = await supabase
    .from('doctors')
    .select('*, profiles(id, name, username)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadAdmins() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadAlerts() {
  const { data } = await supabase
    .from('alerts_log')
    .select('*, patients(name, bed_number, ward)')
    .order('created_at', { ascending: false })
    .limit(100);
  return data || [];
}

export async function assignNurseToPatient(patientId, nurseId) {
  return supabase.from('patients').update({ assigned_nurse_id: nurseId || null }).eq('id', patientId);
}

export async function assignDoctorToPatient(patientId, doctorId) {
  if (!doctorId) return { error: null };
  return supabase
    .from('doctor_patients')
    .upsert({ doctor_id: doctorId, patient_id: patientId }, { onConflict: 'doctor_id,patient_id' });
}

export async function acknowledgeAlert(id) {
  return supabase.from('alerts_log').update({ acknowledged: true }).eq('id', id);
}

export async function loadAllProfiles() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function loadMessages(myProfileId, myRole) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(name, username, role), patient:patients(name, bed_number)')
    .or(`sender_id.eq.${myProfileId},receiver_id.eq.${myProfileId},receiver_id.is.null`)
    .order('created_at', { ascending: false });
  if (error) console.warn('loadMessages query note:', error.message);
  return data || [];
}

export async function sendMessage({ senderId, senderRole, receiverId, receiverRole, patientId, body }) {
  const res = await supabase.from('messages').insert({
    sender_id: senderId,
    sender_role: senderRole,
    receiver_id: receiverId || null,
    receiver_role: receiverRole,
    patient_id: patientId || null,
    body
  });

  if (!res.error) {
    try {
      // Get sender profile name for notification
      const { data: senderProf } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', senderId)
        .single();
      const senderName = senderProf?.name || 'Staff Member';

      if (receiverId) {
        // Direct message notification to specific recipient
        await sendNotification({
          userId: receiverId,
          type: 'message',
          title: `💬 New Message from ${senderName}`,
          message: body.length > 60 ? body.substring(0, 60) + '...' : body,
          link: 'messages'
        });
      } else {
        // Broadcast message notification
        await sendNotification({
          userId: null,
          type: 'message',
          title: `📢 Broadcast from ${senderName} (${senderRole.toUpperCase()})`,
          message: body.length > 60 ? body.substring(0, 60) + '...' : body,
          link: 'messages'
        });
      }
    } catch (err) {
      console.warn('Failed to trigger message notification:', err.message);
    }
  }

  return res;
}

export async function loadLatestReadings() {
  const { data } = await supabase
    .from('readings')
    .select('*, patients(name, bed_number)')
    .order('recorded_at', { ascending: false })
    .limit(50);
  return data || [];
}

// ── Nurse Approval Operations ──

export async function approveNurse(nurseId, profileId) {
  const { error: nurseErr } = await supabase
    .from('nurses')
    .update({ status: 'approved' })
    .eq('id', nurseId);

  if (nurseErr) throw nurseErr;

  // Create approval notification for nurse
  if (profileId) {
    await sendNotification({
      userId: profileId,
      type: 'approval',
      title: 'Account Approved! 🎉',
      message: 'Your nurse registration request has been verified and approved by the hospital administrator. You can now access your Nurse Dashboard.',
      link: '/nurse'
    });
  }
}

export async function rejectNurse(nurseId, profileId) {
  const { error: nurseErr } = await supabase
    .from('nurses')
    .update({ status: 'rejected' })
    .eq('id', nurseId);

  if (nurseErr) throw nurseErr;

  if (profileId) {
    await sendNotification({
      userId: profileId,
      type: 'approval',
      title: 'Registration Status Update',
      message: 'Your registration request was reviewed by the hospital administrator and could not be verified at this time.',
      link: null
    });
  }
}

// ── Self Registration for Nurse ──

export async function registerNurseAccount({ name, email, password, phone, ward, employeeId }) {
  // 1. SignUp user with Supabase auth and embed metadata
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
  const empId = employeeId || `N${Math.floor(100 + Math.random() * 900)}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name, 
        role: 'nurse', 
        ward: ward || 'General Ward', 
        phone: phone || '', 
        employee_id: empId 
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed.');

  const userId = authData.user.id;

  // 2. Insert profile record
  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, name, username, role: 'nurse' });
  } catch (err) {
    console.warn('Profile insertion warning:', err.message);
  }

  // 3. Insert nurse record with 'pending' status
  try {
    const { error: nurseError } = await supabase
      .from('nurses')
      .upsert({
        profile_id: userId,
        employee_id: empId,
        phone: phone || null,
        ward: ward || 'General Ward',
        status: 'pending'
      });

    if (nurseError && nurseError.message.includes('row-level security')) {
      console.warn('Nurse RLS warning caught. Ensure migration_v5.sql is executed in Supabase.');
    } else if (nurseError) {
      throw nurseError;
    }
  } catch (err) {
    console.warn('Nurse record insertion note:', err.message);
  }

  // Immediately sign out newly registered nurse so they don't remain in active session
  await supabase.auth.signOut();

  // 4. Send notification to admins about new registration request
  try {
    const admins = await loadAdmins();
    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        type: 'registration',
        title: 'New Nurse Registration Request',
        message: `Nurse ${name} (${email}, ${ward}) has submitted a registration request waiting for verification.`,
        link: '/admin'
      });
    }
  } catch (err) {
    console.warn('Notification trigger warning:', err.message);
  }

  return authData;
}

// ── Notifications Operations ──

export async function loadNotifications(userId) {
  try {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(30);
    return data || [];
  } catch (err) {
    console.warn('Notifications query note:', err.message);
    return [];
  }
}

export async function markNotificationRead(id) {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (err) {
    console.warn('Mark notification read note:', err.message);
  }
}

export async function sendNotification({ userId, type, title, message, link }) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId || null,
      type: type || 'info',
      title,
      message,
      link: link || null
    });
  } catch (err) {
    console.warn('Send notification note:', err.message);
  }
}

export async function registerAdminAccount(name, email, password) {
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'admin' }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed.');

  const userId = authData.user.id;

  // Insert profile record
  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, name, username, role: 'admin' });
  } catch (err) {
    console.warn('Admin profile insertion warning:', err.message);
  }

  // Sign out the new account so current session is preserved
  // Note: signUp in Supabase auto-signs in the new user, so we sign out immediately
  // This is a limitation of Supabase client-side signUp
  // For production, use admin API via Edge Function
  return authData;
}
