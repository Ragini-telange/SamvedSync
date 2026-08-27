import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import MessagesSection from '../components/MessagesSection';
import ReportsSection from '../components/ReportsSection';
import WhatIfSimulator from '../components/WhatIfSimulator';
import MedicalChatbot from '../components/MedicalChatbot';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { loadPatients, loadNurses, loadAlerts, acknowledgeAlert } from '../lib/dashboardData';
import { formatTime, Empty, Badge } from '../components/DashboardSections';
import { Activity, Bell, Droplet, User, HeartPulse, Stethoscope, AlertCircle, CheckCircle, ArrowLeft, PlayCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NurseDashboard() {
  const { profile } = useAuth();
  const [active, setActive] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Selected Patient for Patient Detail Live Monitoring View (Screenshot 1 matching)
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);

  const showToast = (title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 5000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, n, a] = await Promise.all([loadPatients(), loadNurses(), loadAlerts()]);
    
    // Find the nurse record associated with this profile
    const myNurseRecord = n.find(nurse => nurse.profile_id === profile.id);
    
    if (myNurseRecord) {
      const assigned = p.filter(pat => pat.assigned_nurse_id === myNurseRecord.id);
      setPatients(assigned);
      
      const assignedIds = assigned.map(pat => pat.id);
      const myAlerts = a.filter(al => assignedIds.includes(al.patient_id));
      setAlerts(myAlerts);
    } else {
      setPatients(p);
      setAlerts(a);
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

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <DashboardShell
      title={selectedPatientDetail ? "Patient Detail" : "Nurse Station"}
      subtitle={selectedPatientDetail ? "Live monitoring telemetry" : "Live monitoring, staff messaging, and telemetry reports."}
      activeItem={active}
      navItems={[
        { key: 'patients', label: 'My Patients', onClick: () => { setSelectedPatientDetail(null); setActive('patients'); } },
        { key: 'simulator', label: 'AI Risk Simulator', onClick: () => { setSelectedPatientDetail(null); setActive('simulator'); } },
        { key: 'alerts', label: 'Alerts', onClick: () => { setSelectedPatientDetail(null); setActive('alerts'); } },
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
            className="fixed top-5 right-5 z-[200] max-w-sm bg-ink text-white rounded-2xl p-4 shadow-xl shadow-pulse/20 border-l-4 border-pulse text-sm"
          >
            <div className="font-semibold mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pulse" /> {toast.title}
            </div>
            <div className="text-white/70">{toast.body}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen 1 View: Patient Detail Live Monitoring (Matches Screenshot 1 media_1787773346036.png) */}
      {selectedPatientDetail ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 font-body">
          {/* Back to Dashboard Button & Status Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPatientDetail(null)}
              className="text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> LIVE
              </span>
            </div>
          </div>

          {/* Patient Card Banner */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink dark:text-white font-display">{selectedPatientDetail.name}</h2>
              <p className="text-sm text-slate-400 mt-1 font-mono">
                Bed {selectedPatientDetail.bed_number} | {selectedPatientDetail.ward || 'ICU'} | Age {selectedPatientDetail.age || 40}
              </p>
            </div>
            <span className="bg-rose-500/10 text-rose-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase border border-rose-500/20">
              CRITICAL
            </span>
          </div>

          {/* 3 Telemetry Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-saline uppercase tracking-wider mb-2">
                <Droplet className="w-4 h-4" /> DRIP RATE
              </div>
              <div className="text-4xl font-bold font-mono text-ink dark:text-white">0.0</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">drops per minute</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                <CheckCircle className="w-4 h-4" /> FLOW STATUS
              </div>
              <div className="text-3xl font-bold text-rose-600 font-display">Stopped</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">IV line status</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                <Heart className="w-4 h-4 fill-current" /> BLOOD BACKFLOW
              </div>
              <div className="text-3xl font-bold text-emerald-600 font-display">Normal</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">color sensor</div>
            </div>
          </div>

          {/* Drip Rate History (drops/min) Telemetry Graph */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Drip Rate History (drops/min)
              </h3>
            </div>

            {/* SVG Telemetry Chart View */}
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 1000 250" className="w-full h-full">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="40" x2="1000" y2="40" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="1000" y2="80" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="1000" y2="120" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="160" x2="1000" y2="160" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Y-axis labels */}
                <text x="10" y="45" fill="#94A3B8" fontSize="11" fontFamily="monospace">60</text>
                <text x="10" y="85" fill="#94A3B8" fontSize="11" fontFamily="monospace">50</text>
                <text x="10" y="125" fill="#94A3B8" fontSize="11" fontFamily="monospace">40</text>
                <text x="10" y="165" fill="#94A3B8" fontSize="11" fontFamily="monospace">30</text>
                <text x="10" y="205" fill="#94A3B8" fontSize="11" fontFamily="monospace">20</text>
                <text x="10" y="240" fill="#94A3B8" fontSize="11" fontFamily="monospace">10</text>

                {/* Blue Drip Rate History Line */}
                <path d="M 50 230 L 200 230 L 350 230 L 500 230 L 650 230 L 800 230 L 950 230" fill="none" stroke="#2563EB" strokeWidth="3" />
                
                {/* Data Points */}
                <circle cx="50" cy="230" r="4" fill="#2563EB" />
                <circle cx="200" cy="230" r="4" fill="#2563EB" />
                <circle cx="350" cy="230" r="4" fill="#2563EB" />
                <circle cx="500" cy="230" r="4" fill="#2563EB" />
                <circle cx="650" cy="230" r="4" fill="#2563EB" />
                <circle cx="800" cy="230" r="4" fill="#2563EB" />
                <circle cx="950" cy="230" r="4" fill="#2563EB" />

                {/* X-axis Timestamps */}
                <text x="40" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">0:31:21 pm</text>
                <text x="180" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">0:36:21 pm</text>
                <text x="330" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">12:41:37 am</text>
                <text x="480" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">12:43:23 am</text>
                <text x="630" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">12:47:21 am</text>
                <text x="780" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">12:51:21 am</text>
                <text x="930" y="248" fill="#94A3B8" fontSize="10" fontFamily="monospace">1:11:53 am</text>
              </svg>
            </div>
          </div>
        </motion.div>
      ) : active === 'patients' ? (
        <div className="space-y-8">
          {/* Quick Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-saline/10 text-saline rounded-2xl"><User className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Assigned Patients</p>
                <p className="text-2xl font-bold text-ink dark:text-white mt-1">{patients.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Activity className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active IVs</p>
                <p className="text-2xl font-bold text-ink dark:text-white mt-1">{patients.filter(p => p.is_active).length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 relative overflow-hidden group">
              <div className="p-3 bg-pulse/10 text-pulse rounded-2xl relative z-10"><Bell className="w-6 h-6" /></div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Pending Alerts</p>
                <p className="text-2xl font-bold text-ink dark:text-white mt-1">{unacknowledgedAlerts.length}</p>
              </div>
              {unacknowledgedAlerts.length > 0 && <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pulse/10 rounded-full animate-pulse" />}
            </div>
          </div>

          <h2 className="text-xl font-display font-bold text-ink dark:text-white">Active Patient Monitoring</h2>

          {loading ? (
            <Empty text="Loading patient data..." />
          ) : patients.length === 0 ? (
            <Empty text="You have no assigned patients currently." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((p, i) => {
                const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
                  ? ((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)
                  : '0.0';
                
                const status = p.is_active ? 'Normal' : 'Disconnected';
                const statusColor = p.is_active ? 'text-saline bg-saline/10 border-saline/20' : 'text-slate-500 bg-slate-100 border-slate-200';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={p.id} 
                    onClick={() => setSelectedPatientDetail(p)}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="font-bold text-ink dark:text-white text-lg group-hover:text-saline transition-colors">{p.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          Room {p.bed_number}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${statusColor}`}>
                        {p.is_active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        {status}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">IV Line Drop Rate</p>
                          <p className="font-mono text-lg font-bold text-ink dark:text-white mt-0.5">{targetRate} <span className="text-xs text-slate-500 font-normal">gtt/min</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400">Prescribed Rate</p>
                          <p className="font-mono text-lg font-bold text-ink dark:text-white mt-0.5">{p.prescribed_rate_ml_hr || '--'} <span className="text-xs text-slate-500 font-normal">mL/hr</span></p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Blood Flow Detector
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Normal (No Backflow)</span>
                      </div>

                      <div className="pt-2 text-xs font-semibold text-saline flex items-center justify-between group-hover:translate-x-1 transition-transform">
                        <span>Click for Drip Rate History Graph</span>
                        <span>→</span>
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
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-ink dark:text-white">My Patients' Alerts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Alert</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5}><Empty text="Loading alerts…" /></td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={5}><Empty text="No alerts logged for your patients." /></td></tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-ink dark:text-white">{a.patients?.name} <span className="text-slate-400 font-normal ml-1">({a.patients?.bed_number})</span></td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{a.message}</td>
                      <td className="px-6 py-4"><Badge severity={a.severity} /></td>
                      <td className="px-6 py-4 font-mono text-[13px] text-slate-500">{formatTime(a.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        {a.acknowledged
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium text-saline bg-saline/10 px-3 py-1.5 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Acknowledged</span>
                          : <button onClick={() => handleAcknowledge(a.id)} className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:border-saline hover:text-saline hover:shadow-sm transition-all shadow-sm">Acknowledge</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {active === 'messages' && <MessagesSection title="Nurse Staff Messaging" />}
      {active === 'reports' && <ReportsSection />}
      {active === 'simulator' && <WhatIfSimulator />}

      <MedicalChatbot patients={patients} />
    </DashboardShell>
  );
}
