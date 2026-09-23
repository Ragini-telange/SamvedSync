import { useState } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, ShieldAlert, 
  Clock, Droplet, ArrowRight, Sparkles, RefreshCw, Info, HelpCircle
} from 'lucide-react';
import { calculatePrototypeRisk } from '../lib/riskEngine';

/**
 * SamvedSync What-If IV Infusion Simulator
 * 
 * STRICT COMPLIANCE RULES:
 * 1. SIMULATION ONLY — NOT REAL SENSOR DATA.
 *    Real hardware data (drop rate, flow status, reverse blood flow) is streamed directly
 *    from ESP32 sensors via Wi-Fi and ThingSpeak into active patient telemetry.
 * 2. Transparent, rule-based mathematical calculations (No fake trained ML models).
 * 3. Compares prescribed flow rate vs simulated adjustment, calculating time to depletion.
 */
export default function WhatIfSimulator() {
  // Simulation Inputs
  const [totalVolume, setTotalVolume] = useState(1000); // Total bag volume in mL
  const [remainingVolume, setRemainingVolume] = useState(650); // Current volume remaining in mL
  const [prescribedRate, setPrescribedRate] = useState(100); // Prescribed rate in mL/hr
  const [simulatedRate, setSimulatedRate] = useState(125); // Simulated flow rate in mL/hr
  const [dropFactor, setDropFactor] = useState(15); // Drop factor (10, 15, 20, 60 gtt/mL)
  const [simulatedBackflow, setSimulatedBackflow] = useState(false); // Simulated reverse blood flow

  // Mathematical Infusion Calculations
  // Drip rate in drops/min (gtt/min) = (mL/hr * dropFactor) / 60
  const prescribedGttMin = Math.round((prescribedRate * dropFactor) / 60);
  const simulatedGttMin = simulatedRate > 0 ? Math.round((simulatedRate * dropFactor) / 60) : 0;

  // Time to depletion in minutes = (volume in mL / rate in mL/hr) * 60
  const prescribedMinutes = prescribedRate > 0 ? Math.round((remainingVolume / prescribedRate) * 60) : 0;
  const simulatedMinutes = simulatedRate > 0 ? Math.round((remainingVolume / simulatedRate) * 60) : Infinity;

  // Time difference
  const timeDifferenceMins = simulatedRate > 0 ? Math.abs(prescribedMinutes - simulatedMinutes) : 0;
  const isFaster = simulatedRate > prescribedRate;

  // Remaining percentage
  const remainingPercent = Math.min(100, Math.max(0, Math.round((remainingVolume / totalVolume) * 100)));

  // Prototype Transparent Rule-Based Risk Engine Evaluation
  const riskAnalysis = calculatePrototypeRisk({
    dripRate: simulatedGttMin,
    flowStatus: simulatedRate > 0 ? 1 : 0,
    reverseFlow: simulatedBackflow,
    ivLevel: remainingPercent,
    targetRate: prescribedGttMin,
    recentAlertsCount: simulatedBackflow ? 1 : 0
  });

  const formatHoursMins = (totalMins) => {
    if (totalMins === Infinity || totalMins <= 0) return totalMins === Infinity ? 'Infusion Stopped' : '0 min';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins} min`;
    return `${hrs}h ${mins}m`;
  };

  const loadPreset = (type) => {
    if (type === 'standard') {
      setTotalVolume(1000);
      setRemainingVolume(750);
      setPrescribedRate(100);
      setSimulatedRate(100);
      setDropFactor(15);
      setSimulatedBackflow(false);
    } else if (type === 'accelerated') {
      setTotalVolume(500);
      setRemainingVolume(400);
      setPrescribedRate(80);
      setSimulatedRate(160);
      setDropFactor(20);
      setSimulatedBackflow(false);
    } else if (type === 'low_fluid') {
      setTotalVolume(500);
      setRemainingVolume(45);
      setPrescribedRate(100);
      setSimulatedRate(100);
      setDropFactor(15);
      setSimulatedBackflow(false);
    } else if (type === 'occlusion') {
      setTotalVolume(1000);
      setRemainingVolume(500);
      setPrescribedRate(100);
      setSimulatedRate(0);
      setDropFactor(15);
      setSimulatedBackflow(false);
    } else if (type === 'backflow') {
      setTotalVolume(1000);
      setRemainingVolume(350);
      setPrescribedRate(100);
      setSimulatedRate(0);
      setDropFactor(15);
      setSimulatedBackflow(true);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* MANDATORY PROMINENT SIMULATION DISCLAIMER BANNER */}
      <div className="bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                  SIMULATION — NOT REAL SENSOR DATA
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
                  Hardware Wi-Fi Telemetry Guard
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Real patient drop rate, flow status, and reverse blood flow are fetched continuously from ESP32 hardware via Wi-Fi and ThingSpeak. This interactive calculator is strictly a hypothetical scenario planner for healthcare staff.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => loadPreset('standard')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
            >
              Standard
            </button>
            <button
              onClick={() => loadPreset('accelerated')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
            >
              Accelerated
            </button>
            <button
              onClick={() => loadPreset('low_fluid')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            >
              Low Fluid
            </button>
            <button
              onClick={() => loadPreset('backflow')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
            >
              Backflow
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Calculation Comparison */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Simulation Inputs (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-saline" />
              Hypothetical Infusion Parameters
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              Interactive What-If
            </span>
          </div>

          {/* 1. Fluid Volume Remaining */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-saline" /> Remaining Bag Fluid Volume:
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-saline text-sm">{remainingVolume} mL</span>
                <span className="text-slate-400 font-mono text-xs">({remainingPercent}%)</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max={totalVolume}
              step="10"
              value={remainingVolume}
              onChange={(e) => setRemainingVolume(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-saline"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0 mL (Empty)</span>
              <span>Total Bag: {totalVolume} mL</span>
            </div>
          </div>

          {/* 2. Bag Size & Drop Factor */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Total Bag Volume (mL)
              </label>
              <select
                value={totalVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalVolume(val);
                  if (remainingVolume > val) setRemainingVolume(val);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-saline/20"
              >
                <option value={100}>100 mL (Mini-bag)</option>
                <option value={250}>250 mL (Small bag)</option>
                <option value={500}>500 mL (Standard bag)</option>
                <option value={1000}>1000 mL (Large bag)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Tubing Drop Factor (gtt/mL)
              </label>
              <select
                value={dropFactor}
                onChange={(e) => setDropFactor(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-saline/20"
              >
                <option value={10}>10 gtt/mL (Macro Drip)</option>
                <option value={15}>15 gtt/mL (Standard Macro)</option>
                <option value={20}>20 gtt/mL (Fine Macro)</option>
                <option value={60}>60 gtt/mL (Micro Drip)</option>
              </select>
            </div>
          </div>

          {/* 3. Prescribed Rate vs Simulated Rate */}
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Prescribed Rate (mL/hr)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={prescribedRate}
                onChange={(e) => setPrescribedRate(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-ink dark:text-white"
              />
              <div className="text-xs text-slate-500 font-mono">
                Target: <strong className="text-saline">{prescribedGttMin} gtt/min</strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-2">
              <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Simulated Adjusted Rate (mL/hr)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={simulatedRate}
                onChange={(e) => setSimulatedRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-blue-600"
              />
              <div className="text-xs text-slate-500 font-mono">
                Simulated: <strong className="text-blue-600">{simulatedGttMin} gtt/min</strong>
              </div>
            </div>
          </div>

          {/* 4. Simulated Reverse Blood Flow Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${simulatedBackflow ? 'bg-rose-500/15 text-rose-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-ink dark:text-white">Simulate Reverse Blood Flow</h4>
                <p className="text-[11px] text-slate-500">Test safety rules for venous backflow into line</p>
              </div>
            </div>

            <button
              onClick={() => setSimulatedBackflow(!simulatedBackflow)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                simulatedBackflow 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {simulatedBackflow ? 'BLOOD DETECTED' : 'CLEAR / NORMAL'}
            </button>
          </div>
        </div>

        {/* Right Column: Comparative Time & Safety Output (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Time Remaining Comparison Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-saline" />
              Time-to-Depletion Comparison
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">Prescribed Time</span>
                <span className="text-xl font-bold font-mono text-ink dark:text-white">
                  {formatHoursMins(prescribedMinutes)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">@ {prescribedRate} mL/hr</span>
              </div>

              <div className="bg-blue-500/10 dark:bg-blue-500/15 p-4 rounded-2xl border border-blue-500/20">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase block mb-1">Simulated Time</span>
                <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                  {formatHoursMins(simulatedMinutes)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">@ {simulatedRate} mL/hr</span>
              </div>
            </div>

            {/* Time Difference Summary Pill */}
            {simulatedRate !== prescribedRate && simulatedRate > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Difference in Completion:</span>
                <span className={`font-mono font-bold ${isFaster ? 'text-amber-600' : 'text-blue-600'}`}>
                  {isFaster ? `Finish ~${formatHoursMins(timeDifferenceMins)} earlier` : `Finish ~${formatHoursMins(timeDifferenceMins)} later`}
                </span>
              </div>
            )}
            {simulatedRate === 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-xs font-semibold text-rose-600">
                Infusion is halted (0 mL/hr). Bag will not deplete until roller clamp is opened.
              </div>
            )}
          </div>

          {/* Prototype Rule-Based Risk Index */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Prototype Risk Evaluation
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskAnalysis.badgeColor}`}>
                {riskAnalysis.level} RISK
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-display font-bold font-mono text-ink dark:text-white">
                {riskAnalysis.score}<span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <div className="flex-1">
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${riskAnalysis.score}%`, 
                      backgroundColor: riskAnalysis.gaugeColor || (riskAnalysis.score >= 51 ? '#ef4444' : riskAnalysis.score >= 21 ? '#f59e0b' : '#10b981') 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contributing Risk Factors & Reasons */}
            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 uppercase tracking-wider block text-[10px]">
                Active Safety Factors:
              </span>
              {riskAnalysis.factors && riskAnalysis.factors.length > 0 ? (
                riskAnalysis.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> All parameters within standard safety limits
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1">
              {riskAnalysis.disclaimer}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
