import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import MessagesSection from '../components/MessagesSection';
import ReportsSection from '../components/ReportsSection';
import WhatIfSimulator from '../components/WhatIfSimulator';
import MedicalChatbot from '../components/MedicalChatbot';
import PatientMonitoringView from '../components/PatientMonitoringView';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { loadPatients, loadNurses, loadDoctors, loadAlerts, acknowledgeAlert } from '../lib/dashboardData';
import { syncPatientThingSpeakData } from '../lib/thingspeakSync';
import { formatTime, Empty, Badge } from '../components/DashboardSections';
import { Activity, Bell, Droplet, User, HeartPulse, Stethoscope, AlertCircle, CheckCircle, ArrowLeft, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NurseDashboard() {
  const { profile } = useAuth();
  const [active, setActive] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Selected Patient for Patient Detail Live Monitoring View
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);

  const showToast = (title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 5000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, n, d, a] = await Promise.all([loadPatients(), loadNurses(), loadDoctors(), loadAlerts()]);
    setNurses(n);
    setDoctors(d);

    // Filter strictly for this nurse's assigned patients
    const myNurseRecord = n.find(nurse => nurse.profile_id === profile.id);
    
    if (myNurseRecord) {
      const assigned = p.filter(pat => pat.assigned_nurse_id === myNurseRecord.id);
      setPatients(assigned);
      
      const assignedIds = assigned.map(pat => pat.id);
      const myAlerts = a.filter(al => assignedIds.includes(al.patient_id));
      setAlerts(myAlerts);

      // Trigger background ThingSpeak hardware sync for assigned patients
      assigned.forEach(pat => {
        syncPatientThingSpeakData(pat).catch(() => {});
      });
    } else {
      setPatients([]);
      setAlerts([]);
    }
    
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Live updates via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('nurse-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts_log' }, (payload) => {
        showToast(
          payload.new.severity === 'critical' ? '🔴 Critical alert' : '🟡 Alert',
          payload.new.message
        );
        loadAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadAll]);

  async function handleAcknowledge(id) {
    await acknowledgeAlert(id);
    loadAll();
  }

  // Security Guard: Ensure nurse cannot access an unassigned patient
  function handleSelectPatient(pat) {
    if (!patients.some(p => p.id === pat.id)) {
      alert("Unauthorized: You may only access patients assigned to you.");
      return;
    }
    setSelectedPatientDetail(pat);
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <DashboardShell
      title={selectedPatientDetail ? "Patient Telemetry" : "Nurse Station"}
      subtitle={selectedPatientDetail ? "Real-time hardware IV monitoring" : "My Assigned Patients & Clinical Alerts"}
      activeItem={active}
      navItems={[
        { key: 'patients', label: 'My Assigned Patients', onClick: () => { setSelectedPatientDetail(null); setActive('patients'); } },
        { key: 'simulator', label: 'AI Risk Simulator', onClick: () => { setSelectedPatientDetail(null); setActive('simulator'); } },
        { key: 'alerts', label: 'Alerts', badge: unacknowledgedAlerts.length, onClick: () => { setSelectedPatientDetail(null); setActive('alerts'); } },
        { key: 'messages', label: 'Messages', onClick: () => { setSelectedPatientDetail(null); setActive('messages'); } },
        { key: 'reports', label: 'Reports', onClick: () => { setSelectedPatientDetail(null); setActive('reports'); } }
      ]}
    >
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[200] max-w-sm bg-ink text-white rounded-2xl p-4 shadow-xl border-l-4 border-pulse text-sm"
          >
            <div className="font-semibold mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pulse" /> {toast.title}
            </div>
            <div className="text-white/70 text-xs">{toast.body}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Patient Monitoring View for Selected Assigned Patient */}
      {selectedPatientDetail ? (
        <PatientMonitoringView
          patient={selectedPatientDetail}
          onBack={() => setSelectedPatientDetail(null)}
          nurses={nurses}
          doctors={doctors}
          showToast={showToast}
        />
      ) : active === 'patients' ? (
        <div className="space-y-8 font-body">
          {/* Quick Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-saline/10 text-saline rounded-2xl"><User className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Assigned Patients</p>
                <p className="text-3xl font-bold text-ink dark:text-white mt-1 font-display">{patients.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Activity className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active IV Lines</p>
                <p className="text-3xl font-bold text-ink dark:text-white mt-1 font-display">{patients.filter(p => p.is_active).length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl relative z-10"><Bell className="w-6 h-6" /></div>
              <div className="relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending Alerts</p>
                <p className="text-3xl font-bold text-ink dark:text-white mt-1 font-display">{unacknowledgedAlerts.length}</p>
              </div>
              {unacknowledgedAlerts.length > 0 && <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-rose-500/10 rounded-full animate-pulse" />}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-ink dark:text-white">
              My Assigned Patients ({patients.length})
            </h2>
            <span className="text-xs text-slate-400">
              Only showing patients assigned to you
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading assigned patients...</div>
          ) : patients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No patients currently assigned.</p>
              <p className="text-xs mt-1">Contact your hospital administrator or doctor to assign patients to your roster.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((p, i) => {
                const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
                  ? ((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)
                  : '25.0';
                
                const status = p.is_active ? 'Normal' : 'Disconnected';
                const statusColor = p.is_active ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-100 border-slate-200';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.id} 
                    onClick={() => handleSelectPatient(p)}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group cursor-pointer"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="font-bold text-ink dark:text-white text-lg group-hover:text-saline transition-colors">{p.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Room / Bed: {p.bed_number} ({p.ward || 'ICU'})
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusColor}`}>
                        {p.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {status}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col gap-4 justify-between">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">IV Line Drop Rate</p>
                          <p className="font-mono text-lg font-bold text-saline mt-0.5">{targetRate} <span className="text-xs text-slate-400 font-normal">gtt/min</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prescribed Rate</p>
                          <p className="font-mono text-lg font-bold text-ink dark:text-white mt-0.5">{p.prescribed_rate_ml_hr || 100} <span className="text-xs text-slate-400 font-normal">mL/hr</span></p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 fill-current" /> Blood Flow Detector
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Normal (No Backflow)</span>
                      </div>

                      <div className="pt-2 text-xs font-semibold text-saline flex items-center justify-between group-hover:translate-x-1 transition-transform border-t border-slate-100 dark:border-slate-800">
                        <span>Open Complete Telemetry View</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {active === 'alerts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-saline" />
              <h2 className="font-semibold text-ink dark:text-white">My Patients' Alerts ({alerts.length})</h2>
            </div>
            <span className="text-xs text-slate-400">{unacknowledgedAlerts.length} Pending Resolution</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Alert Message</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5}><Empty text="Loading alerts…" /></td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={5}><Empty text="No alerts logged for your assigned patients." /></td></tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-ink dark:text-white">
                        {a.patients?.name || 'Patient'} 
                        <span className="text-slate-400 font-normal ml-1">({a.patients?.bed_number || 'Bed'})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-xs font-medium">{a.message}</td>
                      <td className="px-6 py-4"><Badge severity={a.severity} /></td>
                      <td className="px-6 py-4 font-mono text-[13px] text-slate-500">{formatTime(a.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {a.acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleAcknowledge(a.id)} 
                            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:border-saline hover:text-saline hover:shadow-sm transition-all shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {active === 'messages' && <MessagesSection title="Nurse Direct Communication Hub" />}
      {active === 'reports' && <ReportsSection role="nurse" />}
      {active === 'simulator' && <WhatIfSimulator />}

      <MedicalChatbot patients={patients} />
    </DashboardShell>
  );
}
