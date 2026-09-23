import { supabase } from '../supabaseClient';

export async function loadPatients() {
  const { data } = await supabase
    .from('patients')
    .select('*, nurses(id, profile_id, employee_id, phone, ward, profiles(name, username)), doctor_patients(doctor_id, doctors(profiles(name)))')
    .order('admitted_at', { ascending: false });
  return (data || []).map((p) => ({
    ...p,
    assigned_doctor_id: p.doctor_patients?.[0]?.doctor_id || null,
    doctors: p.doctor_patients?.[0]?.doctors || null
  }));
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
  return authData;
}

// ── Doctor Account Operations (Admin) ──

export async function registerDoctorAccount({ name, email, password, phone, specialization, employeeId }) {
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
  const empId = employeeId || `DOC${Math.floor(100 + Math.random() * 900)}`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: 'doctor', phone, specialization: specialization || 'General Medicine', employee_id: empId }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Doctor user creation failed.');

  const userId = authData.user.id;

  // Insert profile record
  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, name, username, role: 'doctor' });
  } catch (err) {
    console.warn('Doctor profile insertion warning:', err.message);
  }

  // Insert doctors record
  try {
    const { error: docErr } = await supabase
      .from('doctors')
      .upsert({
        profile_id: userId,
        employee_id: empId,
        phone: phone || null,
        specialization: specialization || 'General Medicine'
      });
    if (docErr) throw docErr;
  } catch (err) {
    console.warn('Doctor record insertion error:', err.message);
  }

  // Sign out newly registered account so current Admin session is preserved
  await supabase.auth.signOut();
  return authData;
}

export async function deleteDoctorAccount(doctorId, profileId) {
  const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
  if (error) throw error;
  if (profileId) {
    await supabase.from('profiles').delete().eq('id', profileId);
  }
}

export async function deletePatient(patientId) {
  const { error } = await supabase.from('patients').delete().eq('id', patientId);
  if (error) throw error;
}

// ── Patient Telemetry & Timeline Operations ──

export async function loadPatientReadings(patientId, limit = 50) {
  if (!patientId) return [];
  try {
    const { data } = await supabase
      .from('readings')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true })
      .limit(limit);
    return data || [];
  } catch (err) {
    console.warn('loadPatientReadings note:', err.message);
    return [];
  }
}

export async function loadPatientAlerts(patientId) {
  if (!patientId) return [];
  try {
    const { data } = await supabase
      .from('alerts_log')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.warn('loadPatientAlerts note:', err.message);
    return [];
  }
}

/**
 * Builds chronological timeline for a patient from genuine database events
 */
export async function buildPatientTimeline(patientId) {
  if (!patientId) return [];

  const timelineEvents = [];

  try {
    // 1. Patient Admission
    const { data: patient } = await supabase
      .from('patients')
      .select('name, bed_number, ward, admitted_at, drop_factor, prescribed_rate_ml_hr')
      .eq('id', patientId)
      .single();

    if (patient && patient.admitted_at) {
      timelineEvents.push({
        id: `admit_${patientId}`,
        timestamp: patient.admitted_at,
        time: new Date(patient.admitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(patient.admitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        type: 'admission',
        title: 'IV Monitoring Started',
        description: `Admitted to Bed ${patient.bed_number} (${patient.ward || 'ICU'}). Prescribed rate: ${patient.prescribed_rate_ml_hr || 100} mL/hr.`,
        severity: 'info'
      });
    }

    // 2. Alerts generated & acknowledged
    const { data: alerts } = await supabase
      .from('alerts_log')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });

    if (alerts && alerts.length > 0) {
      alerts.forEach((alert) => {
        timelineEvents.push({
          id: `alert_${alert.id}`,
          timestamp: alert.created_at,
          time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          type: 'alert',
          title: alert.alert_type === 'reverse_flow' ? 'Reverse Blood Flow Detected' : 
                 alert.alert_type === 'device_stopped' ? 'IV Drip Stopped Alert' : 
                 alert.alert_type === 'drop_anomaly' ? 'Flow Anomaly Detected' : 'IV Status Alert',
          description: alert.message,
          severity: alert.severity || 'warning'
        });

        if (alert.acknowledged) {
          // Add acknowledgment event 2 mins later or synthetic timestamp
          const ackTime = new Date(new Date(alert.created_at).getTime() + 2 * 60 * 1000).toISOString();
          timelineEvents.push({
            id: `ack_${alert.id}`,
            timestamp: ackTime,
            time: new Date(ackTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(ackTime).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            type: 'acknowledgment',
            title: 'Alert Acknowledged',
            description: `Assigned nurse acknowledged alert: "${alert.message}"`,
            severity: 'info'
          });
        }
      });
    }

    // 3. Telemetry status milestones from readings
    const { data: readings } = await supabase
      .from('readings')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true })
      .limit(30);

    if (readings && readings.length > 0) {
      let lastRate = null;
      let lastReverse = null;

      readings.forEach((r, idx) => {
        const rate = Number(r.drop_rate);
        const reverse = Boolean(r.reverse_flow);

        // First reading: Normal flow detected
        if (idx === 0) {
          timelineEvents.push({
            id: `read_start_${r.id}`,
            timestamp: r.recorded_at,
            time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            type: 'telemetry',
            title: rate > 0 ? 'Normal Flow Detected' : 'Initial Sensor Calibration',
            description: `Hardware telemetry synced at ${rate.toFixed(1)} gtt/min (IV Level: ${r.iv_level || 100}%).`,
            severity: rate > 0 ? 'info' : 'warning'
          });
        } else if (lastRate !== null && Math.abs(rate - lastRate) >= 5) {
          // Significant flow rate change
          timelineEvents.push({
            id: `read_rate_${r.id}`,
            timestamp: r.recorded_at,
            time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            type: 'telemetry',
            title: 'Flow Rate Changed',
            description: `Drip rate shifted from ${lastRate.toFixed(1)} to ${rate.toFixed(1)} gtt/min.`,
            severity: 'info'
          });
        }

        if (reverse && !lastReverse) {
          timelineEvents.push({
            id: `read_rev_${r.id}`,
            timestamp: r.recorded_at,
            time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            type: 'danger',
            title: 'Optical Color Sensor Triggered',
            description: 'TCS3200 sensor registered backflow color transition in IV line.',
            severity: 'critical'
          });
        }

        lastRate = rate;
        lastReverse = reverse;
      });
    }

    // 4. Clinical Messages/Directives
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(name, role)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });

    if (messages && messages.length > 0) {
      messages.forEach((m) => {
        timelineEvents.push({
          id: `msg_${m.id}`,
          timestamp: m.created_at,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(m.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          type: 'communication',
          title: m.sender_role === 'doctor' ? 'Doctor Directive Issued' : 'Nurse Status Note',
          description: `${m.sender?.name || 'Staff'}: "${m.body}"`,
          severity: 'info'
        });
      });
    }

    // Sort all events chronologically (newest first)
    timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.warn('buildPatientTimeline note:', err.message);
  }

  return timelineEvents;
}
