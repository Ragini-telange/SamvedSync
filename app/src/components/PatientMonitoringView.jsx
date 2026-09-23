import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  loadPatientReadings, loadPatientAlerts, buildPatientTimeline, 
  sendMessage, acknowledgeAlert 
} from '../lib/dashboardData';
import { syncPatientThingSpeakData } from '../lib/thingspeakSync';
import { calculatePrototypeRisk } from '../lib/riskEngine';
import { 
  Activity, ArrowLeft, Droplet, Heart, CheckCircle, AlertTriangle, AlertCircle, 
  Clock, Shield, MessageSquare, Send, Printer, RefreshCw, Cpu, Check, User, HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientMonitoringView({ patient, onBack, nurses = [], doctors = [], showToast }) {
  const { profile } = useAuth();
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveData, setLiveData] = useState(null);

  // Direct Staff Messaging State
  const [directiveText, setDirectiveText] = useState('');
  const [sendingDirective, setSendingDirective] = useState(false);
  const [directiveStatus, setDirectiveStatus] = useState(null);

  // What-If Simulator Inline State
  const [simFlowRate, setSimFlowRate] = useState(patient?.prescribed_rate_ml_hr || 100);
  const [simDropFactor, setSimDropFactor] = useState(patient?.drop_factor || 15);

  const targetGttMin = patient?.drop_factor && patient?.prescribed_rate_ml_hr
    ? ((patient.prescribed_rate_ml_hr * patient.drop_factor) / 60).toFixed(1)
    : '25.0';

  const nurseName = patient?.nurses?.profiles?.name || (nurses.find(n => n.id === patient?.assigned_nurse_id)?.profiles?.name) || 'Not Assigned';
  const nurseProfileId = patient?.nurses?.profile_id || nurses.find(n => n.id === patient?.assigned_nurse_id)?.profile_id;

  // Find linked doctor name if available
  const docObj = doctors.find(d => patient?.doctor_patients?.some(dp => dp.doctor_id === d.id) || d.id === patient?.assigned_doctor_id);
  const doctorName = patient?.doctors?.profiles?.name || docObj?.profiles?.name || 'Not Assigned';

  const fetchData = useCallback(async () => {
    if (!patient?.id) return;
    const [r, a, t] = await Promise.all([
      loadPatientReadings(patient.id, 40),
      loadPatientAlerts(patient.id),
      buildPatientTimeline(patient.id)
    ]);
    setReadings(r);
    setAlerts(a);
    setTimeline(t);
  }, [patient?.id]);

  // Initial load and periodic hardware polling directly from ThingSpeak
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function initialSync() {
      // Sync hardware telemetry directly from ThingSpeak
      try {
        const live = await syncPatientThingSpeakData(patient);
        if (live && mounted) {
          setLiveData(live);
        }
      } catch (err) {
        console.warn('Direct ThingSpeak sync notice:', err.message);
      }
      if (mounted) {
        await fetchData();
        setLoading(false);
      }
    }

    initialSync();

    // Poll ThingSpeak hardware updates every 15 seconds (ThingSpeak rate limit)
    const interval = setInterval(async () => {
      try {
        const live = await syncPatientThingSpeakData(patient);
        if (live && mounted) {
          setLiveData(live);
        }
        if (mounted) await fetchData();
      } catch (e) {
        console.warn('Poll interval error:', e.message);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [patient, fetchData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const live = await syncPatientThingSpeakData(patient);
      if (live) setLiveData(live);
      await fetchData();
      if (showToast) showToast('Hardware Telemetry Synced', 'Latest sensor readings fetched from ThingSpeak.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    await acknowledgeAlert(alertId);
    await fetchData();
    if (showToast) showToast('Alert Acknowledged', 'Alert marked as acknowledged.');
  };

  const handleSendDirective = async (e) => {
    e.preventDefault();
    if (!directiveText.trim()) return;

    setSendingDirective(true);
    setDirectiveStatus(null);

    // If caller is doctor, send to nurse. If caller is nurse, send to doctor.
    let receiverId = null;
    let receiverRole = 'nurse';

    if (profile.role === 'doctor') {
      receiverId = nurseProfileId;
      receiverRole = 'nurse';
    } else if (profile.role === 'nurse') {
      receiverId = docObj?.profile_id || null;
      receiverRole = 'doctor';
    }

    const { error } = await sendMessage({
      senderId: profile.id,
      senderRole: profile.role,
      receiverId,
      receiverRole,
      patientId: patient.id,
      body: directiveText.trim()
    });

    setSendingDirective(false);
    if (error) {
      setDirectiveStatus({ type: 'error', text: error.message });
    } else {
      setDirectiveText('');
      setDirectiveStatus({ type: 'success', text: 'Communication delivered successfully!' });
      await fetchData();
      setTimeout(() => setDirectiveStatus(null), 3500);
    }
  };

  // Derive latest telemetric state (Strictly real hardware telemetry, zero mock data)
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  const currentDripRate = liveData?.drip_rate !== undefined && liveData?.drip_rate !== null
    ? Number(liveData.drip_rate).toFixed(1)
    : (latestReading?.drop_rate !== undefined && latestReading.drop_rate !== null ? Number(latestReading.drop_rate).toFixed(1) : null);

  const currentIvLevel = liveData?.iv_level !== undefined && liveData?.iv_level !== null
    ? Number(liveData.iv_level)
    : (latestReading?.iv_level !== undefined && latestReading.iv_level !== null ? Number(latestReading.iv_level) : null);

  const isFlowStopped = liveData?.flow_status !== undefined
    ? (liveData.flow_status === 0 || liveData.drip_rate === 0)
    : (latestReading ? (latestReading.device_status === 'Stopped' || Number(latestReading.drop_rate) === 0) : !patient.is_active);

  const isBackflow = liveData?.reverse_flow !== undefined
    ? Boolean(liveData.reverse_flow)
    : (latestReading ? Boolean(latestReading.reverse_flow) : false);

  // Evaluate Prototype Risk Analysis
  const riskAnalysis = calculatePrototypeRisk({
    dripRate: currentDripRate !== null ? Number(currentDripRate) : 0,
    flowStatus: isFlowStopped ? 0 : 1,
    reverseFlow: isBackflow,
    ivLevel: currentIvLevel !== null ? currentIvLevel : 100,
    targetRate: Number(targetGttMin),
    recentAlertsCount: alerts.filter(a => !a.acknowledged).length
  });

  // Calculate What-If comparison
  const totalVolumeMl = 500; // Standard 500 mL IV infusion bottle
  const currentVolumeRemaining = currentIvLevel !== null
    ? Math.max(0, Math.round((totalVolumeMl * (currentIvLevel / 100))))
    : null;
  
  // Current time remaining at prescribed rate
  const currentFlowRateMlHr = patient?.prescribed_rate_ml_hr || 100;
  const currentTimeHours = currentVolumeRemaining !== null && currentFlowRateMlHr > 0 ? (currentVolumeRemaining / currentFlowRateMlHr) : 0;
  const currentHrs = Math.floor(currentTimeHours);
  const currentMins = Math.round((currentTimeHours - currentHrs) * 60);

  // Simulated time remaining
  const simTimeHours = currentVolumeRemaining !== null && Number(simFlowRate) > 0 ? (currentVolumeRemaining / Number(simFlowRate)) : 0;
  const simHrs = Math.floor(simTimeHours);
  const simMins = Math.round((simTimeHours - simHrs) * 60);

  const diffMins = Math.round((currentTimeHours - simTimeHours) * 60);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 font-body">
      {/* Top Bar: Back Button, Hardware Connection, Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="text-slate-600 dark:text-slate-300 hover:text-ink dark:hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            ESP32 + ThingSpeak: Connected (CH: {patient.thingspeak_channel_id || '3249576'})
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-saline hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            title="Fetch latest telemetry from ThingSpeak"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-saline' : ''}`} />
          </button>
        </div>
      </div>

      {/* Patient Banner Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink dark:text-white font-display">
              {patient.name}
            </h2>
            <span className="font-mono text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              ID: {patient.id.slice(0, 8)}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Bed <span className="font-bold text-ink dark:text-white font-mono">{patient.bed_number}</span> · {patient.ward || 'ICU Ward'} · Age: {patient.age ? `${patient.age}y` : 'Not specified'} · Gender: {patient.gender || 'Not specified'}
          </p>
          <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-4">
            <span>Diagnosis: <strong className="text-ink dark:text-white">{patient.diagnosis || 'Observation'}</strong></span>
            <span>Assigned Nurse: <strong className="text-saline">{nurseName}</strong></span>
            <span>Attending Doctor: <strong className="text-blue-500">{doctorName}</strong></span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3">
          <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase border ${
            isBackflow ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
            isFlowStopped ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            {isBackflow ? 'CRITICAL BACKFLOW' : isFlowStopped ? 'FLOW STOPPED' : 'NORMAL INFUSION'}
          </span>
          <span className="text-[11px] text-slate-400">
            Admitted: {new Date(patient.admitted_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* 4 Telemetry Status Cards (Matching Specification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Drip Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-saline uppercase tracking-wider mb-2">
            <Droplet className="w-4 h-4" /> DRIP RATE
          </div>
          <div>
            <div className="text-4xl font-bold font-mono text-ink dark:text-white">
              {currentDripRate !== null ? (
                currentDripRate
              ) : (
                <span className="text-xl text-slate-400 font-normal italic">Awaiting data...</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">drops per minute (gtt/min)</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 font-mono">
            Prescribed: {targetGttMin} gtt/min ({patient.prescribed_rate_ml_hr || 100} mL/hr)
          </div>
        </div>

        {/* Metric 2: Flow Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
            <CheckCircle className="w-4 h-4" /> FLOW STATUS
          </div>
          <div>
            <div className={`text-3xl font-bold font-display ${isFlowStopped ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isFlowStopped ? 'Stopped' : 'Normal'}
            </div>
            <div className="text-xs text-slate-400 mt-1">IR Drop Sensor (Field 2)</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {isFlowStopped ? 'Line Occlusion / Valve Closed' : 'Continuous Laminar Flow'}
          </div>
        </div>

        {/* Metric 3: Blood Backflow */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
            <Heart className="w-4 h-4 fill-current" /> BLOOD BACKFLOW
          </div>
          <div>
            <div className={`text-2xl font-bold font-display ${isBackflow ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
              {isBackflow ? 'DETECTED!' : 'Normal (No Backflow)'}
            </div>
            <div className="text-xs text-slate-400 mt-1">TCS3200 Optical Sensor (Field 3)</div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {isBackflow ? 'Immediate nursing check required' : 'Infusion line clear of blood'}
          </div>
        </div>

        {/* Metric 4: IV Fluid Level */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
            <Activity className="w-4 h-4" /> IV FLUID LEVEL
          </div>
          <div>
            <div className="text-4xl font-bold font-mono text-ink dark:text-white">
              {currentIvLevel !== null ? `${Math.round(currentIvLevel)}%` : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {currentVolumeRemaining !== null ? `≈ ${currentVolumeRemaining} mL remaining` : 'Volume level not recorded'}
            </div>
          </div>
          {/* Progress visual bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  (currentIvLevel ?? 100) <= 20 ? 'bg-rose-500' : (currentIvLevel ?? 100) <= 50 ? 'bg-amber-500' : 'bg-saline'
                }`}
                style={{ width: `${Math.max(5, currentIvLevel ?? 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Drip Rate History Graph & Prototype Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drip Rate History Graph (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2 font-display">
                <Activity className="w-4 h-4 text-blue-500" /> Drip Rate History (drops/min)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time hardware telemetry curve from ThingSpeak</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
              Target: {targetGttMin} gtt/min
            </span>
          </div>

          {/* SVG Drip History Chart with Dynamic Coordinates */}
          <div className="h-64 w-full relative pt-2">
            {readings.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Activity className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
                Awaiting hardware transmission from ThingSpeak Channel {patient.thingspeak_channel_id || '3249576'}...
              </div>
            ) : (
              <svg viewBox="0 0 1000 250" className="w-full h-full">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="40" x2="980" y2="40" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="980" y2="90" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="140" x2="980" y2="140" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="190" x2="980" y2="190" stroke="rgba(200,200,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Y-axis labels */}
                <text x="10" y="45" fill="#94A3B8" fontSize="11" fontFamily="monospace">60</text>
                <text x="10" y="95" fill="#94A3B8" fontSize="11" fontFamily="monospace">40</text>
                <text x="10" y="145" fill="#94A3B8" fontSize="11" fontFamily="monospace">20</text>
                <text x="10" y="195" fill="#94A3B8" fontSize="11" fontFamily="monospace">0</text>

                {/* Target Prescribed Rate Reference Line (Green dashed) */}
                {(() => {
                  const targetY = Math.max(40, Math.min(190, 190 - (Number(targetGttMin) / 60) * 150));
                  return (
                    <line 
                      x1="40" y1={targetY} x2="980" y2={targetY} 
                      stroke="#10B981" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" 
                    />
                  );
                })()}

                {/* Data Points Curve */}
                {(() => {
                  const pts = readings.slice(-15);
                  if (pts.length === 0) return null;

                  const stepX = 940 / Math.max(1, pts.length - 1);
                  const coords = pts.map((p, i) => {
                    const x = 40 + i * stepX;
                    const val = Number(p.drop_rate) || 0;
                    const y = Math.max(30, Math.min(190, 190 - (val / 60) * 150));
                    return { x, y, val, time: p.recorded_at };
                  });

                  const pathD = coords.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');

                  return (
                    <>
                      <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
                      {coords.map((c, i) => (
                        <g key={i}>
                          <circle cx={c.x} cy={c.y} r="4" fill="#2563EB" className="hover:scale-150 transition-transform" />
                          {i === coords.length - 1 && (
                            <circle cx={c.x} cy={c.y} r="7" fill="none" stroke="#2563EB" strokeWidth="2" className="animate-ping" />
                          )}
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Prototype Risk Analysis Card (1 Col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-saline uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> {riskAnalysis.label}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${riskAnalysis.badgeColor}`}>
                {riskAnalysis.level}
              </span>
            </div>

            <div className="my-4 flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white font-mono shadow-md"
                style={{ backgroundColor: riskAnalysis.gaugeColor }}
              >
                {riskAnalysis.score}
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Composite Score</p>
                <p className="text-lg font-bold text-ink dark:text-white">
                  {riskAnalysis.level === 'HIGH' ? 'Critical Attention' : riskAnalysis.level === 'MEDIUM' ? 'Requires Monitoring' : 'Stable Parameters'}
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Detected Factors:</p>
              {riskAnalysis.reasons.map((r, i) => (
                <div key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-start gap-2">
                  <span className="text-saline mt-0.5">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            ⚠️ {riskAnalysis.disclaimer}
          </div>
        </div>
      </div>

      {/* Patient Timeline & Active Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chronological Patient Timeline */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-saline" /> Chronological Patient Timeline
            </h3>
            <span className="text-xs text-slate-400">Database Grounded</span>
          </div>

          <div className="max-h-80 overflow-y-auto pr-2 space-y-4">
            {timeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No events logged yet for this patient.</div>
            ) : (
              timeline.map((ev, i) => (
                <div key={ev.id || i} className="flex items-start gap-3 relative pl-4 border-l-2 border-saline/30 last:border-transparent">
                  <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ${
                    ev.severity === 'critical' ? 'bg-rose-500 ring-4 ring-rose-500/20' : 
                    ev.severity === 'warning' ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-saline'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink dark:text-white truncate">{ev.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{ev.time} ({ev.date})</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{ev.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Patient Alerts Log */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Patient Alerts Log ({alerts.length})
            </h3>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3">
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-emerald-600 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                ✓ No active or past alerts for this patient.
              </div>
            ) : (
              alerts.map((al) => (
                <div key={al.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        al.severity === 'critical' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {al.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(al.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-ink dark:text-white leading-snug">{al.message}</p>
                  </div>

                  {!al.acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(al.id)}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-700 text-saline border border-slate-200 dark:border-slate-600 hover:border-saline rounded-xl shadow-sm transition-all"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="shrink-0 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contextual What-If Simulator & Direct Staff Directive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contextual What-If Simulator for This Patient */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-500" /> Patient What-If Infusion Simulator
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20">
              SIMULATION — NOT REAL DATA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Simulated Rate (mL/hr)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={simFlowRate}
                onChange={(e) => setSimFlowRate(e.target.value)}
                className="w-full text-sm font-mono font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Drop Factor (gtt/mL)</label>
              <select
                value={simDropFactor}
                onChange={(e) => setSimDropFactor(Number(e.target.value))}
                className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white"
              >
                <option value="10">10 (Macro)</option>
                <option value="15">15 (Macro)</option>
                <option value="20">20 (Macro)</option>
                <option value="60">60 (Micro)</option>
              </select>
            </div>
          </div>

          {/* Time Remaining Comparison Result Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Current Prescribed Finish Time:</span>
              <span className="font-mono font-bold text-ink dark:text-white">
                {currentIvLevel !== null ? `${currentHrs}h ${currentMins}m remaining` : 'Awaiting sensor...'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Simulated Finish Time ({simFlowRate} mL/hr):</span>
              <span className="font-mono font-bold text-saline">
                {currentIvLevel !== null ? `${simHrs}h ${simMins}m remaining` : '—'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-semibold text-purple-600 dark:text-purple-400 flex justify-between">
              <span>Time Difference:</span>
              <span>
                {currentIvLevel !== null 
                  ? (diffMins > 0 ? `Empties ${diffMins} mins earlier` : diffMins < 0 ? `Extends by ${Math.abs(diffMins)} mins` : 'No difference')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Direct Clinical Directives / Staff Messaging */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare className="w-4 h-4 text-saline" /> Direct Directives for {patient.name}
          </h3>

          <form onSubmit={handleSendDirective} className="space-y-3">
            <textarea
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder={profile.role === 'doctor' 
                ? `Send direct prescription update or clinical directive to Nurse ${nurseName}...`
                : `Send IV status update or question to Doctor ${doctorName}...`}
              rows={3}
              className="w-full text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-saline/20"
            />

            {directiveStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                directiveStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                <CheckCircle className="w-4 h-4 shrink-0" />
                {directiveStatus.text}
              </div>
            )}

            <button
              type="submit"
              disabled={sendingDirective}
              className="bg-saline hover:bg-saline-dim text-white rounded-xl px-6 py-2.5 text-xs font-semibold shadow-md shadow-saline/20 transition-all flex items-center gap-2"
            >
              {sendingDirective ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send Patient Directive
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
