import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import {
  Overview, NursesSection, AdminsSection, AlertsSection,
  AddPatientModal, AddStaffModal, Empty
} from '../components/DashboardSections';
import DoctorPatientBoxes from '../components/DoctorPatientBoxes';
import MessagesSection from '../components/MessagesSection';
import ReportsSection from '../components/ReportsSection';
import WhatIfSimulator from '../components/WhatIfSimulator';
import MedicalChatbot from '../components/MedicalChatbot';
import { supabase } from '../supabaseClient';
import {
  loadPatients, loadNurses, loadDoctors, loadAdmins, loadAlerts,
  assignNurseToPatient, assignDoctorToPatient, acknowledgeAlert,
  loadPendingNurses, approveNurse, rejectNurse
} from '../lib/dashboardData';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorDashboard() {
  const [active, setActive] = useState('overview');
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [pendingNurses, setPendingNurses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [chatNurseId, setChatNurseId] = useState(null);
  const [chatPatientId, setChatPatientId] = useState(null);

  const [modal, setModal] = useState(null); // 'patient' | 'nurse' | 'admin' | null

  const showToast = (title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 5000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, n, pn, d, ad, a] = await Promise.all([
      loadPatients(),
      loadNurses(),
      loadPendingNurses(),
      loadDoctors(),
      loadAdmins(),
      loadAlerts()
    ]);
    setPatients(p); setNurses(n); setPendingNurses(pn); setDoctors(d); setAdmins(ad); setAlerts(a);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Live updates: new alerts push in automatically via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('doctor-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts_log' }, (payload) => {
        showToast(
          payload.new.severity === 'critical' ? '🔴 Critical alert' : '🟡 Alert',
          payload.new.message
        );
        loadAll();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nurses' }, () => {
        showToast('🆕 Registration', 'New nurse registration request received!');
        loadAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  async function handleAssignNurse(patientId, nurseId) {
    const { error } = await assignNurseToPatient(patientId, nurseId);
    if (error) return alert(error.message);
    loadAll();
  }
  async function handleAssignDoctor(patientId, doctorId) {
    const { error } = await assignDoctorToPatient(patientId, doctorId);
    if (error) return alert(error.message);
    showToast('Assigned', 'Doctor linked to patient.');
  }
  async function handleAcknowledge(id) {
    await acknowledgeAlert(id);
    loadAll();
  }

  function handleOpenChatWithNurse(nurseId, patientId) {
    setChatNurseId(nurseId);
    setChatPatientId(patientId);
    setActive('messages');
  }

  async function handleApprove(nurse) {
    try {
      await approveNurse(nurse.id, nurse.profile_id);
      showToast('Nurse Approved', `Nurse ${nurse.profiles?.name || ''} verified and added to hospital members.`);
      loadAll();
    } catch (err) {
      alert(err.message || 'Approval failed.');
    }
  }

  async function handleReject(nurse) {
    if (!confirm(`Are you sure you want to reject registration for Nurse ${nurse.profiles?.name}?`)) return;
    try {
      await rejectNurse(nurse.id, nurse.profile_id);
      showToast('Registration Rejected', `Nurse request was rejected.`);
      loadAll();
    } catch (err) {
      alert(err.message || 'Rejection failed.');
    }
  }

  return (
    <DashboardShell
      title={sectionTitle(active)}
      subtitle={sectionSubtitle(active)}
      activeItem={active}
      navItems={[
        { key: 'overview', label: 'Overview', onClick: () => setActive('overview') },
        { key: 'patients', label: 'All Patients', onClick: () => setActive('patients') },
        { key: 'simulator', label: 'AI Risk Simulator', onClick: () => setActive('simulator') },
        { key: 'nurses', label: 'Nurses', onClick: () => setActive('nurses') },
        { key: 'verification', label: 'Nurse Verification', badge: pendingNurses.length, onClick: () => setActive('verification') },
        { key: 'admins', label: 'Admins', onClick: () => setActive('admins') },
        { key: 'alerts', label: 'Alerts', onClick: () => setActive('alerts') },
        { key: 'messages', label: 'Messages', onClick: () => setActive('messages') },
        { key: 'reports', label: 'Reports', onClick: () => setActive('reports') }
      ]}
    >
      {toast && (
        <div className="fixed top-5 right-5 z-[200] max-w-sm bg-ink text-white rounded-2xl px-5 py-4 border-l-4 border-pulse shadow-xl text-sm">
          <div className="font-semibold mb-0.5">{toast.title}</div>
          <div className="text-white/70">{toast.body}</div>
        </div>
      )}

      {active === 'overview' && (
        <Overview
          patients={patients} nurses={nurses}
          extraStat={{ label: 'Admins', value: admins.length }}
          alerts={alerts} unacknowledged={unacknowledged} loading={loading}
        />
      )}

      {active === 'patients' && (
        <DoctorPatientBoxes
          patients={patients} nurses={nurses} doctors={doctors} loading={loading}
          onAssignNurse={handleAssignNurse}
          onAssignDoctor={handleAssignDoctor}
          showToast={showToast}
          onOpenChatWithNurse={handleOpenChatWithNurse}
        />
      )}

      {active === 'nurses' && <NursesSection nurses={nurses} loading={loading} />}

      {/* Nurse Verification Pending Requests Section for Doctor */}
      {active === 'verification' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Pending Nurse Registration Requests
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Doctors or Admins can verify pending nurse registration requests to add them as active hospital members.
              </p>
            </div>
            <div className="bg-amber-500/10 text-amber-600 font-bold px-4 py-2 rounded-2xl border border-amber-500/20 text-sm">
              {pendingNurses.length} Pending
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Nurse Name</th>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Ward / Unit</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Requested At</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={7}><Empty text="Loading pending requests..." /></td></tr>
                  ) : pendingNurses.length === 0 ? (
                    <tr><td colSpan={7}><Empty text="No pending nurse registration requests." /></td></tr>
                  ) : (
                    pendingNurses.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-ink dark:text-white">
                          {n.profiles?.name || 'Nurse'}
                          <div className="text-xs text-slate-400 font-normal">{n.profiles?.username}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-saline">{n.employee_id || '—'}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{n.ward || 'General Ward'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{n.phone || '—'}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(n.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(n)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(n)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl border border-rose-500/20 transition-all flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {active === 'admins' && <AdminsSection admins={admins} loading={loading} onAdd={() => setModal('admin')} />}
      {active === 'alerts' && <AlertsSection alerts={alerts} loading={loading} onAcknowledge={handleAcknowledge} />}
      {active === 'messages' && (
        <MessagesSection 
          preselectedNurseId={chatNurseId}
          patientId={chatPatientId}
          title="Doctor & Nurse Direct Communication" 
        />
      )}
      {active === 'reports' && <ReportsSection />}
      {active === 'simulator' && <WhatIfSimulator />}

      <AddStaffModal role="admin" open={modal === 'admin'} onClose={() => setModal(null)} onDone={() => { setModal(null); loadAll(); }} />
      <MedicalChatbot patients={patients} />
    </DashboardShell>
  );
}

function sectionTitle(key) {
  return { 
    overview: 'Doctor Overview', 
    patients: 'Patient Clinical Cards', 
    simulator: 'AI What-If Risk Simulator',
    nurses: 'Nurse Roster', 
    verification: 'Nurse Registration Requests',
    alerts: 'Central Alerts Triage',
    messages: 'Doctor & Nurse Communication',
    reports: 'Clinical Telemetry Reports'
  }[key];
}
function sectionSubtitle(key) {
  return {
    overview: 'Hospital-wide snapshot, updated in real time.',
    patients: 'Inspect individual patient cards and message assigned nurses directly.',
    simulator: 'Test hypothetical IV fluid levels, drip rates, and blood backflow risks.',
    nurses: 'View active nurse members of the hospital.',
    verification: 'Verify and approve pending nurse registration requests.',
    alerts: 'Full alert history across all patients.',
    messages: 'Direct messaging interface with assigned nurses and hospital staff.',
    reports: 'Export patient IV readings as CSV or PDF report.'
  }[key];
}
