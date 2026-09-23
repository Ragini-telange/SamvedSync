import { useState } from 'react';
import PatientMonitoringView from './PatientMonitoringView';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, User, Plus, HeartPulse, Droplet, MessageSquare, 
  CheckCircle, ArrowRight, Heart, ShieldAlert 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorPatientBoxes({ 
  patients, nurses = [], doctors = [], loading, onAdd, 
  onAssignNurse, onAssignDoctor, showToast, onOpenChatWithNurse 
}) {
  const { profile } = useAuth();
  const [patientDetailView, setPatientDetailView] = useState(null);

  function handleMessageNurseClick(p, e) {
    if (e) e.stopPropagation();
    if (!p.assigned_nurse_id && !p.nurses) {
      if (showToast) showToast('No Nurse Assigned', 'Please assign a nurse to this patient first.');
      else alert('No nurse is currently assigned to this patient.');
      return;
    }
    const nurseId = p.assigned_nurse_id || p.nurses?.id;
    if (onOpenChatWithNurse) {
      onOpenChatWithNurse(nurseId, p.id);
    } else {
      setPatientDetailView(p);
    }
  }

  // Complete Patient Monitoring Page View (Opens on card click)
  if (patientDetailView) {
    return (
      <PatientMonitoringView
        patient={patientDetailView}
        onBack={() => setPatientDetailView(null)}
        nurses={nurses}
        doctors={doctors}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="font-bold text-ink dark:text-white text-xl flex items-center gap-2 font-display">
            <HeartPulse className="w-5 h-5 text-saline" />
            Patient Clinical Monitoring Cards
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time IV telemetry stream from ESP32 & ThingSpeak. Click any card to open complete clinical telemetry and directives.
          </p>
        </div>

        {onAdd && (
          <button 
            onClick={onAdd} 
            className="bg-saline hover:bg-saline-dim text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-saline/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Patient
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-saline border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading patient telemetry cards...
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          No patients registered yet. Click "Add Patient" to initialize IV monitoring.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p, i) => {
            const targetRate = p.drop_factor && p.prescribed_rate_ml_hr
              ? ((p.prescribed_rate_ml_hr * p.drop_factor) / 60).toFixed(1)
              : '25.0';

            const nurseName = p.nurses?.profiles?.name || (nurses.find(n => n.id === p.assigned_nurse_id)?.profiles?.name) || 'Unassigned';
            
            // Real hardware telemetry from latest reading
            const reading = p.latest_reading;
            const hasReading = !!reading;
            const liveDropRate = hasReading && reading.drop_rate !== null && reading.drop_rate !== undefined 
              ? Number(reading.drop_rate).toFixed(1) 
              : null;
            const liveDropCount = hasReading && reading.drop_count !== null && reading.drop_count !== undefined 
              ? reading.drop_count 
              : null;
            const isStopped = hasReading 
              ? (reading.device_status === 'Stopped' || Number(reading.drop_rate) === 0) 
              : !p.is_active;
            const isBackflow = hasReading ? Boolean(reading.reverse_flow) : false;
            const ivLevel = hasReading && reading.iv_level !== null && reading.iv_level !== undefined 
              ? Math.round(Number(reading.iv_level)) 
              : null;

            const statusText = isBackflow 
              ? 'Backflow Alert' 
              : isStopped 
              ? 'Drip Stopped' 
              : p.is_active 
              ? 'Flowing Normal' 
              : 'Inactive';

            const statusClass = isBackflow 
              ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' 
              : isStopped 
              ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' 
              : p.is_active 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
              : 'bg-slate-100 text-slate-500 border-slate-200';

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={p.id}
                onClick={() => setPatientDetailView(p)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                <div>
                  {/* Card Header: Patient Name, ID, Bed, Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-ink dark:text-white text-lg group-hover:text-saline transition-colors">
                          {p.name}
                        </h3>
                        {p.age && (
                          <span className="text-xs text-slate-400 font-mono">({p.age}y)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        ID: {p.id.slice(0, 8)} · Bed {p.bed_number} ({p.ward || 'ICU'})
                      </p>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isBackflow ? 'bg-rose-500 animate-ping' : isStopped ? 'bg-amber-500' : p.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {statusText}
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid (Strictly Real Sensor Hardware Telemetry) */}
                  <div className="space-y-3 mb-6">
                    {/* Rate & Drop Count Comparison Box */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Live Rate</span>
                        <span className="font-mono font-bold text-saline text-sm sm:text-base mt-0.5 block">
                          {liveDropRate !== null ? (
                            <>
                              {liveDropRate} <span className="text-[10px] text-slate-400 font-normal">gtt/m</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal italic">Awaiting</span>
                          )}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Drop Count</span>
                        <span className="font-mono font-bold text-sky-500 text-sm sm:text-base mt-0.5 block">
                          {liveDropCount !== null ? (
                            <>
                              {liveDropCount} <span className="text-[10px] text-slate-400 font-normal">drops</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal italic">—</span>
                          )}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Target</span>
                        <span className="font-mono font-bold text-ink dark:text-white text-sm sm:text-base mt-0.5 block">
                          {targetRate} <span className="text-[10px] text-slate-400 font-normal">gtt/m</span>
                        </span>
                      </div>
                    </div>

                    {/* Blood Flow Detector Row */}
                    <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs border ${
                      isBackflow 
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      <span className="font-semibold flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-current" /> Blood Flow Detector
                      </span>
                      <span className="font-bold">
                        {isBackflow ? '⚠️ Blood Backflow Detected!' : '✓ Clear (No Backflow)'}
                      </span>
                    </div>

                    {/* IV Level & Assigned Staff Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-slate-500">IV Fluid Level:</span>
                        <span className="font-mono font-bold text-ink dark:text-white">
                          {ivLevel !== null ? `${ivLevel}%` : '—'}
                        </span>
                      </div>
                      <span className="text-slate-400 truncate max-w-[130px]">
                        Nurse: <strong className="text-saline">{nurseName}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: View Details & Message Nurse */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPatientDetailView(p)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    View Details →
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
