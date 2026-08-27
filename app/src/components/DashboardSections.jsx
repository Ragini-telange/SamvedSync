import { useState } from 'react';
import Modal from './Modal';
import Field, { inputClass } from './Field';
import { supabase } from '../supabaseClient';
import { createStaffAccount } from '../lib/staffApi';
import { registerAdminAccount, registerNurseAccount } from '../lib/dashboardData';
import { 
  Activity, Bell, Users, Plus, Shield, CheckCircle, AlertTriangle, 
  AlertCircle, TrendingUp, Droplet, Edit, Trash2, HeartPulse, ArrowLeft, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ================================================
// Shared Badges & Helpers
// ================================================
export function Badge({ severity }) {
  const styles = {
    critical: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    info: 'bg-saline/10 text-saline border-saline/20'
  };
  
  const icons = {
    critical: <AlertCircle className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    info: <Activity className="w-3.5 h-3.5" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[severity] || styles.info}`}>
      {icons[severity] || icons.info}
      <span className="capitalize">{severity}</span>
    </span>
  );
}

export function Empty({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
        <Activity className="w-6 h-6 text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm text-slate-500 font-medium">{text}</p>
    </div>
  );
}

export function formatTime(iso) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Matching Screenshot 2 Stat Cards with Colored Left Borders
function MediFlowStatCard({ label, value, icon: Icon, borderClass, iconClass, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm ${borderClass} flex items-center justify-between hover:shadow-md transition-all`}
    >
      <div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-bold text-ink dark:text-white font-display mt-1">
          {value}
        </div>
      </div>
      {Icon && (
        <div className={`p-3.5 rounded-2xl ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </motion.div>
  );
}

// ================================================
// Overview Dashboard Section — Matches Screenshot 2 (media_1787773403462.png)
// ================================================
export function Overview({ patients, nurses, extraStat, unacknowledged, alerts, loading, onManagePatients, onManageNurses }) {
  return (
    <div className="space-y-8 font-body">
      {/* Top 4 MediFlow Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MediFlowStatCard 
          delay={0.0} 
          icon={Users} 
          label="Total Patients" 
          value={patients.length} 
          borderClass="border-l-4 border-l-emerald-500" 
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
        />
        <MediFlowStatCard 
          delay={0.1} 
          icon={Shield} 
          label="Total Nurses" 
          value={nurses.length} 
          borderClass="border-l-4 border-l-blue-500" 
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
        />
        <MediFlowStatCard 
          delay={0.2} 
          icon={Droplet} 
          label="Active IV Lines" 
          value={patients.filter((p) => p.is_active).length} 
          borderClass="border-l-4 border-l-amber-500" 
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" 
        />
        <MediFlowStatCard 
          delay={0.3} 
          icon={Bell} 
          label="Total Alerts" 
          value={alerts.length} 
          borderClass="border-l-4 border-l-rose-500" 
          iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400" 
        />
      </div>

      {/* Patient Overview Section Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-saline" /> Patient Overview
          </h2>
          {onManagePatients && (
            <button 
              onClick={onManagePatients}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              + Manage Patients
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">PATIENT</th>
                <th className="px-6 py-4">BED</th>
                <th className="px-6 py-4">WARD</th>
                <th className="px-6 py-4">ASSIGNED NURSE</th>
                <th className="px-6 py-4">THINGSPEAK</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6}><Empty text="Loading patients..." /></td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={6}><Empty text="No patients registered." /></td></tr>
              ) : (
                patients.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink dark:text-white text-sm">{p.name}</div>
                      <div className="text-xs text-slate-400">Age: {p.age || 40}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">{p.bed_number}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{p.ward || 'ICU'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs text-saline bg-saline/10 px-3 py-1 rounded-full uppercase border border-saline/20">
                        {p.nurses?.profiles?.name || 'SAVITA MANE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        CH: {p.thingspeak_channel_id || '3249576'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-xs text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Nurse Overview Section Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" /> Nurse Overview
          </h2>
          {onManageNurses && (
            <button 
              onClick={onManageNurses}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              + Manage Nurses
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">NAME</th>
                <th className="px-6 py-4">EMAIL</th>
                <th className="px-6 py-4">EMPLOYEE ID</th>
                <th className="px-6 py-4">WARD</th>
                <th className="px-6 py-4">PHONE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5}><Empty text="Loading nurses..." /></td></tr>
              ) : nurses.length === 0 ? (
                <tr><td colSpan={5}><Empty text="No nurses registered." /></td></tr>
              ) : (
                nurses.slice(0, 5).map((n, idx) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-ink dark:text-white">{n.profiles?.name || 'Savita Mane'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{n.profiles?.username || 'nurse1@mediflow.com'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{n.employee_id || `N00${idx + 1}`}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{n.ward || 'ICU Ward 1A'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{n.phone || '9876543210'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ================================================
// Patients Directory Table with Edit & Delete Actions
// ================================================
export function PatientsSection({ patients, nurses, doctors, loading, onAdd, onAssignNurse, onAssignDoctor, onEditPatient, onDeletePatient }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="font-bold text-ink dark:text-white text-xl">Manage Patients</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add patients, assign nurses, configure ThingSpeak telemetry.</p>
        </div>
        <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">PATIENT</th>
                <th className="px-6 py-4">BED</th>
                <th className="px-6 py-4">WARD</th>
                <th className="px-6 py-4">ASSIGNED NURSE</th>
                <th className="px-6 py-4">THINGSPEAK</th>
                <th className="px-6 py-4 text-center">STATUS</th>
                <th className="px-6 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={8}><Empty text="Loading patients…" /></td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={8}><Empty text="No patients yet. Click Add Patient to get started." /></td></tr>
              ) : (
                patients.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink dark:text-white text-sm">{p.name}</div>
                      <div className="text-xs text-slate-400">Age: {p.age || 40} | {p.diagnosis || 'Post surgery recovery'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{p.bed_number}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{p.ward || 'ICU'}</td>
                    <td className="px-6 py-4">
                      <select
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-saline focus:outline-none focus:ring-2 focus:ring-saline/20"
                        defaultValue={p.assigned_nurse_id || ''}
                        onChange={(e) => onAssignNurse(p.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {nurses.map((n) => <option key={n.id} value={n.id}>{n.profiles?.name || 'Nurse'} ({n.ward || 'ICU'})</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        {p.thingspeak_channel_id || '3249576'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-xs text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEditPatient && onEditPatient(p)}
                          className="p-2 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all" 
                          title="Edit Patient"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDeletePatient && onDeletePatient(p.id)}
                          className="p-2 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all" 
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}

// ================================================
// Generic Staff Table with Actions
// ================================================
export function StaffTable({ headers, rows, loading, onAdd, addLabel, emptyText, title }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="font-bold text-ink dark:text-white text-xl">{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                {headers.map((h) => <th key={h} className="px-6 py-4">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={headers.length}><Empty text="Loading…" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={headers.length}><Empty text={emptyText} /></td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className={`px-6 py-4 text-slate-700 dark:text-slate-300 ${j === 1 ? 'font-mono text-xs' : j === 0 ? 'font-bold text-ink dark:text-white' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

export function NursesSection({ nurses, loading, onAdd, onEdit, onDelete }) {
  const isDoctor = !onAdd && !onEdit && !onDelete;
  const headers = isDoctor
    ? ['#', 'NAME', 'EMAIL', 'EMPLOYEE ID', 'WARD', 'PHONE']
    : ['#', 'NAME', 'EMAIL', 'EMPLOYEE ID', 'WARD', 'PHONE', 'ACTIONS'];

  return (
    <StaffTable
      title={isDoctor ? "Nurse Roster" : "Manage Nurses"}
      loading={loading}
      onAdd={onAdd}
      addLabel="Add Nurse"
      headers={headers}
      rows={nurses.map((n, idx) => {
        const row = [
          idx + 1,
          n.profiles?.name || 'Savita Mane',
          n.profiles?.username || 'nurse1@mediflow.com',
          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{n.employee_id || `N00${idx + 1}`}</span>,
          n.ward || 'ICU Ward 1A',
          n.phone || '9876543210'
        ];

        if (!isDoctor) {
          row.push(
            <div className="flex items-center justify-end gap-2" key={n.id}>
              <button 
                onClick={() => onEdit && onEdit(n)}
                className="p-2 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all"
                title="Edit Nurse"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDelete && onDelete(n.id)}
                className="p-2 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all"
                title="Delete Nurse"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }
        return row;
      })}
      emptyText="No nurses registered yet."
    />
  );
}

export function AdminsSection({ admins, loading, onAdd }) {
  return (
    <StaffTable
      title="Administrators"
      loading={loading} onAdd={onAdd} addLabel="Add Admin"
      headers={['NAME', 'USERNAME', 'CREATED AT']}
      rows={admins.map((a) => [a.name, a.username, formatTime(a.created_at)])}
      emptyText="No admins found."
    />
  );
}

export function AlertsSection({ alerts, loading, onAcknowledge }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-2">
        <Bell className="w-5 h-5 text-slate-500" />
        <h2 className="font-bold text-ink dark:text-white text-base">Hospital Alerts Log</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4">TIMESTAMP</th>
              <th className="px-6 py-4">PATIENT NAME</th>
              <th className="px-6 py-4">BED / WARD</th>
              <th className="px-6 py-4">ALERT TYPE</th>
              <th className="px-6 py-4">ALERT MESSAGE</th>
              <th className="px-6 py-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={6}><Empty text="Loading alerts…" /></td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={6}><Empty text="No alerts logged yet." /></td></tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{formatTime(a.created_at)}</td>
                  <td className="px-6 py-4 font-bold text-ink dark:text-white">{a.patients?.name || 'Ram Patil'}</td>
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-teal-600 bg-teal-500/10 px-2.5 py-1 rounded-lg w-fit">
                    {a.patients?.bed_number || '3B-01'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-xs text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full uppercase border border-rose-500/20">
                      🔴 {a.alert_type || 'DRIP STOPPED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-xs">{a.message}</td>
                  <td className="px-6 py-4 text-right">
                    {a.acknowledged
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-saline bg-saline/10 px-3 py-1.5 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Resolved</span>
                      : <button onClick={() => onAcknowledge(a.id)} className="text-xs font-semibold text-rose-600 border border-rose-200 rounded-xl px-4 py-2 hover:bg-rose-500 hover:text-white transition-all shadow-sm">✓ Resolve</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ================================================
// Edit Patient Modal — Matches Screenshot 3 (media_1787773428716.png)
// ================================================
export function EditPatientModal({ patient, open, onClose, onDone, showToast, nurses = [] }) {
  const [form, setForm] = useState(patient || {});

  if (!open || !patient) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('patients')
      .update({
        name: form.name,
        age: form.age,
        bed_number: form.bed_number,
        ward: form.ward,
        diagnosis: form.diagnosis,
        drop_factor: form.drop_factor || null,
        prescribed_rate_ml_hr: form.prescribed_rate_ml_hr || null,
        thingspeak_channel_id: form.thingspeak_channel_id,
        thingspeak_read_key: form.thingspeak_read_key,
        assigned_nurse_id: form.assigned_nurse_id || null
      })
      .eq('id', patient.id);

    if (error) {
      alert(error.message);
      return;
    }

    if (showToast) showToast('Patient Updated', `${form.name}'s details saved.`);
    onDone();
  }

  const targetRate = form.drop_factor && form.prescribed_rate_ml_hr
    ? `Target: ${((form.prescribed_rate_ml_hr * form.drop_factor) / 60).toFixed(1)} drops/min`
    : 'Calculated automatically upon entry.';

  return (
    <Modal open={open} onClose={onClose} title="Edit Patient" subtitle="Update patient parameters, clinical settings, and IoT configuration.">
      <form onSubmit={handleSave} className="space-y-4 font-body">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Patient Name *">
            <input className={inputClass} value={form.name || ''} onChange={set('name')} required placeholder="Ram Patil" />
          </Field>
          <Field label="Age">
            <input type="number" className={inputClass} value={form.age || ''} onChange={set('age')} placeholder="40" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bed Number *">
            <input className={inputClass} value={form.bed_number || ''} onChange={set('bed_number')} required placeholder="3B-01" />
          </Field>
          <Field label="Ward">
            <input className={inputClass} value={form.ward || ''} onChange={set('ward')} placeholder="ICU" />
          </Field>
        </div>

        <Field label="Diagnosis">
          <input className={inputClass} value={form.diagnosis || ''} onChange={set('diagnosis')} placeholder="Post surgery recovery" />
        </Field>

        {/* Clinical Settings */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-saline" /> Clinical Settings
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Drop factor (gtt/mL)">
            <select className={inputClass} value={form.drop_factor || ''} onChange={set('drop_factor')}>
              <option value="">Select factor…</option>
              <option value="10">10 (Macro)</option>
              <option value="15">15 (Macro)</option>
              <option value="20">20 (Macro)</option>
              <option value="60">60 (Micro)</option>
            </select>
          </Field>
          <Field label="Rate (mL/hr)">
            <input type="number" min="0" step="0.1" className={inputClass} placeholder="e.g. 100" value={form.prescribed_rate_ml_hr || ''} onChange={set('prescribed_rate_ml_hr')} />
          </Field>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 font-mono flex items-center justify-between">
          <span>{targetRate}</span>
        </div>

        {/* IoT Device Settings */}
        <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> ThingSpeak / ESP32 Configuration
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel ID">
              <input className={inputClass} value={form.thingspeak_channel_id || ''} onChange={set('thingspeak_channel_id')} placeholder="3249576" />
            </Field>
            <Field label="Read API Key">
              <input className={inputClass} value={form.thingspeak_read_key || ''} onChange={set('thingspeak_read_key')} placeholder="C6XWY4CA99EDIFKC" />
            </Field>
          </div>
        </div>

        <Field label="Assign Nurse">
          <select 
            className={inputClass} 
            value={form.assigned_nurse_id || ''} 
            onChange={set('assigned_nurse_id')}
          >
            <option value="">Select Nurse...</option>
            {nurses.map((n) => (
              <option key={n.id} value={n.id}>
                {n.profiles?.name || 'Nurse'} ({n.ward || 'ICU Ward 1A'})
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl shadow-md transition-all">
            💾 Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add Patient Modal — Complete with Clinical Settings & Nurse Assignment
export function AddPatientModal({ open, onClose, onDone, showToast, nurses = [] }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const targetRate = form.drop_factor && form.prescribed_rate_ml_hr
    ? `Target: ${((form.prescribed_rate_ml_hr * form.drop_factor) / 60).toFixed(1)} drops/min`
    : 'Calculated automatically upon entry.';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.bed_number) { setError('Name and bed number are required.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('patients').insert({
      name: form.name,
      age: form.age || null,
      bed_number: form.bed_number,
      ward: form.ward || null,
      diagnosis: form.diagnosis || null,
      thingspeak_channel_id: form.thingspeak_channel_id || null,
      thingspeak_read_key: form.thingspeak_read_key || null,
      drop_factor: form.drop_factor || null,
      prescribed_rate_ml_hr: form.prescribed_rate_ml_hr || null,
      assigned_nurse_id: form.assigned_nurse_id || null
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    showToast('Patient added', `${form.name} registered.`);
    setForm({});
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Patient" subtitle="Initialize live monitoring, clinical settings, and IoT configuration.">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name *"><input className={inputClass} value={form.name || ''} onChange={set('name')} required placeholder="e.g. Ram Patil" /></Field>
          <Field label="Age"><input type="number" min="0" className={inputClass} value={form.age || ''} onChange={set('age')} placeholder="40" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bed number *"><input className={inputClass} placeholder="e.g. 3B-01" value={form.bed_number || ''} onChange={set('bed_number')} required /></Field>
          <Field label="Ward"><input className={inputClass} placeholder="e.g. ICU" value={form.ward || ''} onChange={set('ward')} /></Field>
        </div>
        <Field label="Diagnosis"><input className={inputClass} value={form.diagnosis || ''} onChange={set('diagnosis')} placeholder="Post surgery recovery" /></Field>

        {/* Clinical Settings (Drop factor Macro/Micro + Rate mL/hr) */}
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-saline" /> Clinical Infusion Settings
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Drop factor (gtt/mL)">
            <select className={inputClass} value={form.drop_factor || ''} onChange={set('drop_factor')}>
              <option value="">Select factor…</option>
              <option value="10">10 (Macro)</option>
              <option value="15">15 (Macro)</option>
              <option value="20">20 (Macro)</option>
              <option value="60">60 (Micro)</option>
            </select>
          </Field>
          <Field label="Rate (mL/hr)">
            <input type="number" min="0" step="0.1" className={inputClass} placeholder="e.g. 100" value={form.prescribed_rate_ml_hr || ''} onChange={set('prescribed_rate_ml_hr')} />
          </Field>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 font-mono flex items-center justify-between">
          <span>{targetRate}</span>
        </div>

        {/* IoT Device Settings */}
        <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> ThingSpeak / ESP32 Configuration
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel ID"><input className={inputClass} placeholder="3249576" value={form.thingspeak_channel_id || ''} onChange={set('thingspeak_channel_id')} /></Field>
            <Field label="Read API key"><input className={inputClass} placeholder="C6XWY4CA99EDIFKC" value={form.thingspeak_read_key || ''} onChange={set('thingspeak_read_key')} /></Field>
          </div>
        </div>

        {/* Assign Nurse */}
        {nurses.length > 0 && (
          <Field label="Assign Nurse">
            <select 
              className={inputClass} 
              value={form.assigned_nurse_id || ''} 
              onChange={set('assigned_nurse_id')}
            >
              <option value="">Select Nurse...</option>
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.profiles?.name || 'Nurse'} ({n.ward || 'ICU Ward 1A'})
                </option>
              ))}
            </select>
          </Field>
        )}

        {error && <div className="bg-rose-500/10 text-rose-600 p-3 rounded-xl text-sm font-medium">{error}</div>}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 text-sm rounded-xl">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold shadow-md">
            {saving ? 'Saving...' : 'Register Patient'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddStaffModal({ role, open, onClose, onDone, showToast }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  const isNurse = role === 'nurse';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isNurse) {
        // We import it here since it's already available at module scope
        await registerNurseAccount({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone, ward: form.ward, employeeId: form.employeeId,
          status: 'approved' // Direct add skips verification
        });
        if (showToast) showToast('Nurse Added', `${form.name} was successfully registered.`);
      } else {
        await registerAdminAccount(form.name, form.email, form.password);
        if (showToast) showToast('Admin Added', `${form.name} was successfully registered.`);
      }
      setForm({});
      onDone();
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add ${isNurse ? 'Nurse' : 'Admin'}`} subtitle={`Manually create a new ${isNurse ? 'nurse' : 'admin'} account.`}>
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <Field label="Full Name *"><input className={inputClass} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Email *"><input type="email" className={inputClass} value={form.email || ''} onChange={set('email')} required /></Field>
        <Field label="Password *"><input type="password" minLength={6} className={inputClass} value={form.password || ''} onChange={set('password')} required /></Field>
        {isNurse && (
          <>
            <Field label="Employee ID"><input className={inputClass} value={form.employeeId || ''} onChange={set('employeeId')} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone"><input className={inputClass} value={form.phone || ''} onChange={set('phone')} /></Field>
              <Field label="Ward/Unit"><input className={inputClass} value={form.ward || ''} onChange={set('ward')} /></Field>
            </div>
          </>
        )}
        {error && <div className="bg-rose-500/10 text-rose-600 p-3 rounded-xl text-sm font-medium">{error}</div>}
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 rounded-xl">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl shadow-md">{saving ? 'Saving...' : 'Add Account'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function EditNurseModal({ nurse, open, onClose, onDone, showToast }) {
  const [form, setForm] = useState(nurse || {});
  const [saving, setSaving] = useState(false);
  
  if (!open || !nurse) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('nurses')
      .update({
        employee_id: form.employee_id,
        ward: form.ward,
        phone: form.phone
      })
      .eq('id', nurse.id);

    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    
    // We update name in profiles table
    if (form.profiles?.name !== nurse.profiles?.name) {
       await supabase.from('profiles').update({ name: form.profiles.name }).eq('id', nurse.profile_id);
    }

    if (showToast) showToast('Nurse Updated', 'Nurse details saved successfully.');
    onDone();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Nurse" subtitle="Update nurse employment details.">
      <form onSubmit={handleSave} className="space-y-4 font-body">
        <Field label="Full Name *">
          <input className={inputClass} value={form.profiles?.name || ''} onChange={(e) => setForm(f => ({...f, profiles: {...f.profiles, name: e.target.value}}))} required />
        </Field>
        <Field label="Employee ID">
          <input className={inputClass} value={form.employee_id || ''} onChange={set('employee_id')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input className={inputClass} value={form.phone || ''} onChange={set('phone')} />
          </Field>
          <Field label="Ward/Unit">
            <input className={inputClass} value={form.ward || ''} onChange={set('ward')} />
          </Field>
        </div>
        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-3 rounded-xl">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl shadow-md">{saving ? 'Saving...' : '💾 Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
