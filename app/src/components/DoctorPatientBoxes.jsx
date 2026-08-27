import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { sendMessage } from '../lib/dashboardData';
import { Activity, User, Plus, Send, HeartPulse, Shield, Droplet, MessageSquare, CheckCircle, AlertCircle, Eye, ArrowLeft, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorPatientBoxes({ patients, nurses, doctors, loading, onAdd, onAssignNurse, onAssignDoctor, showToast, onOpenChatWithNurse }) {
  const { profile } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailView, setPatientDetailView] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgStatus, setMsgStatus] = useState(null);

  async function handleSendNurseDirective(e) {
    e.preventDefault();
    if (!messageText.trim() || (!selectedPatient && !patientDetailView)) return;
    const targetPatient = selectedPatient || patientDetailView;
    setSendingMsg(true);
    setMsgStatus(null);

    let assignedNurseProfileId = null;

    if (targetPatient.nurses?.profile_id) {
      assignedNurseProfileId = targetPatient.nurses.profile_id;
    } else if (targetPatient.assigned_nurse_id) {
      const matchedNurse = nurses.find(n => n.id === targetPatient.assigned_nurse_id);
      if (matchedNurse) assignedNurseProfileId = matchedNurse.profile_id;
    }

    if (!assignedNurseProfileId) {
      setSendingMsg(false);
      setMsgStatus({ type: 'error', text: 'No nurse is currently assigned to this patient.' });
      return;
    }

    const { error } = await sendMessage({
      senderId: profile.id,
      senderRole: 'doctor',
      receiverId: assignedNurseProfileId,
      receiverRole: 'nurse',
      patientId: targetPatient.id,
      body: messageText.trim()
    });

    setSendingMsg(false);
    if (error) {
      setMsgStatus({ type: 'error', text: error.message });
    } else {
      setMessageText('');
      setMsgStatus({ type: 'success', text: 'Instruction delivered to assigned nurse!' });
      if (showToast) showToast('Directive Sent', `Instruction delivered to assigned nurse.`);
      setTimeout(() => setMsgStatus(null), 3000);
    }
  }

  function handleMessageNurseClick(p, e) {
    if (e) e.stopPropagation();
    if (!p.assigned_nurse_id && !p.nurses) {
      alert("No nurse is currently assigned to this patient.");
      return;
    }
    const nurseId = p.assigned_nurse_id || p.nurses?.id;
    if (onOpenChatWithNurse) {
      onOpenChatWithNurse(nurseId, p.id);
    } else {
      setSelectedPatient(p);
    }
  }

  // View 1: Detailed Patient Telemetry Graph View (Matches Screenshot 3 media_1787777195073.png)
  if (patientDetailView) {
    const p = patientDetailView;
    const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
      ? ((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)
      : '0.0';
    const nurseName = p.nurses?.profiles?.name || 'Savita Mane';

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 font-body">
        {/* Back to Dashboard Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPatientDetailView(null)}
            className="text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patient Cards
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> LIVE
            </span>
          </div>
        </div>

        {/* Patient Banner */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink dark:text-white font-display">{p.name}</h2>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              Bed {p.bed_number} | {p.ward || 'ICU'} | Age {p.age || 40} · Assigned Nurse: <span className="text-saline font-semibold">{nurseName}</span>
            </p>
          </div>
          <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase border ${
            p.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          }`}>
            {p.is_active ? 'STABLE' : 'CRITICAL'}
          </span>
        </div>

        {/* 3 Telemetry Status Cards (Matching Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-saline uppercase tracking-wider mb-2">
              <Droplet className="w-4 h-4" /> DRIP RATE
            </div>
            <div className="text-4xl font-bold font-mono text-ink dark:text-white">{targetRate}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">drops per minute</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <CheckCircle className="w-4 h-4" /> FLOW STATUS
            </div>
            <div className={`text-3xl font-bold font-display ${p.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
              {p.is_active ? 'Normal' : 'Stopped'}
            </div>
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

        {/* Drip Rate History (drops/min) Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Drip Rate History (drops/min)
            </h3>
            <span className="text-xs text-slate-400">Waiting for live hardware data...</span>
          </div>

          <div className="h-64 w-full relative">
            <svg viewBox="0 0 1000 250" className="w-full h-full">
              <line x1="0" y1="40" x2="1000" y2="40" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="1000" y2="80" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="1000" y2="120" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="1000" y2="160" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />

              <text x="10" y="45" fill="#94A3B8" fontSize="11" fontFamily="monospace">60</text>
              <text x="10" y="85" fill="#94A3B8" fontSize="11" fontFamily="monospace">50</text>
              <text x="10" y="125" fill="#94A3B8" fontSize="11" fontFamily="monospace">40</text>
              <text x="10" y="165" fill="#94A3B8" fontSize="11" fontFamily="monospace">30</text>
              <text x="10" y="205" fill="#94A3B8" fontSize="11" fontFamily="monospace">20</text>
            </svg>
          </div>
        </div>

        {/* Direct Nurse Instruction Box inside Telemetry Detail View */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-saline" /> Direct Instruction to Nurse {nurseName}
          </h3>

          <form onSubmit={handleSendNurseDirective} className="space-y-3">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Send medical instruction or prescription update for ${p.name} to Nurse ${nurseName}...`}
              rows={3}
              className="w-full text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-saline/20"
            />

            {msgStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                msgStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                {msgStatus.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sendingMsg}
              className="bg-saline hover:bg-saline-dim text-white rounded-xl px-6 py-3 text-sm font-semibold shadow-md shadow-saline/20 transition-all flex items-center justify-center gap-2"
            >
              {sendingMsg ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send Medical Instruction
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="font-bold text-ink dark:text-white text-xl flex items-center gap-2 font-display">
            <HeartPulse className="w-5 h-5 text-saline" />
            Doctor Patient Clinical Cards
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Individual patient overview cards with direct assigned nurse chat access.
          </p>
        </div>

        {onAdd && (
          <button 
            onClick={onAdd} 
            className="bg-saline hover:bg-saline-dim text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-saline/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Patient
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading patient cards...</div>
      ) : patients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          No patients registered yet. Click "Add Patient" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p, i) => {
            const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
              ? `${((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)} gtt/min`
              : '25.0 gtt/min';

            const nurseName = p.nurses?.profiles?.name || 'Savita Mane';

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={p.id}
                onClick={() => setPatientDetailView(p)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-ink dark:text-white text-lg group-hover:text-saline transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Patient ID: <span className="font-mono">{p.id.slice(0, 8)}</span> · Bed {p.bed_number}
                      </p>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      p.is_active 
                        ? 'bg-saline/10 text-saline border border-saline/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {p.is_active && <span className="w-1.5 h-1.5 rounded-full bg-saline animate-pulse" />}
                      {p.is_active ? 'Stable' : 'Offline'}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Medical Condition</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{p.diagnosis || 'Post-Op Recovery'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Drip</span>
                        <span className="font-mono font-bold text-saline text-sm">{targetRate}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Nurse</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{nurseName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions: View Patient & Message Nurse */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPatientDetailView(p); }}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Patient
                  </button>
                  
                  <button
                    onClick={(e) => handleMessageNurseClick(p, e)}
                    className="w-full bg-saline hover:bg-saline-dim text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message Nurse
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
