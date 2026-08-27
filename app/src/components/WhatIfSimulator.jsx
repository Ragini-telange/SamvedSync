import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert, Cpu, Sparkles, RefreshCw, Zap, Clock, Droplet, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatIfSimulator() {
  // Input Simulator Parameters
  const [fluidLevel, setFluidLevel] = useState(75); // % (0 - 100)
  const [dripRate, setDripRate] = useState(25); // gtt/min (0 - 120)
  const [prescribedRate, setPrescribedRate] = useState(100); // mL/hr (10 - 250)
  const [dropFactor, setDropFactor] = useState(15); // 10, 15, 20, 60
  const [isBackflow, setIsBackflow] = useState(false); // boolean
  const [patientAge, setPatientAge] = useState(55); // years
  const [isHighRiskWard, setIsHighRiskWard] = useState(false); // ICU / Pediatrics

  // Calculate Prescribed Target Drip Rate in gtt/min
  const targetGttMin = Math.round((prescribedRate * dropFactor) / 60);
  const rateDeviation = Math.abs(dripRate - targetGttMin);

  // ── AI/ML RISK SCORING ENGINE ──
  // 1. Level Risk Component (0 - 35 points)
  let levelRisk = 0;
  if (fluidLevel <= 5) levelRisk = 35;
  else if (fluidLevel <= 15) levelRisk = 28;
  else if (fluidLevel <= 30) levelRisk = 18;
  else if (fluidLevel <= 50) levelRisk = 8;

  // 2. Drip Rate Deviation Risk Component (0 - 30 points)
  let rateRisk = 0;
  if (dripRate === 0 && fluidLevel > 5) {
    rateRisk = 25; // Drip stopped occlusion
  } else {
    const devRatio = targetGttMin > 0 ? rateDeviation / targetGttMin : 0;
    if (devRatio > 0.5) rateRisk = 30; // Severe under/over infusion
    else if (devRatio > 0.25) rateRisk = 18;
    else if (devRatio > 0.1) rateRisk = 8;
  }

  // 3. Reverse Blood Flow Risk Component (0 - 35 points)
  const backflowRisk = isBackflow ? 35 : 0;

  // 4. Patient Risk Factors (0 - 10 points)
  const ageRisk = (patientAge > 70 || patientAge < 5) ? 5 : 0;
  const wardRisk = isHighRiskWard ? 5 : 0;

  // Total AI Composite Risk Score (0 - 100)
  const totalRiskScore = Math.min(100, Math.round(levelRisk + rateRisk + backflowRisk + ageRisk + wardRisk));

  // Determine Risk Category & Color
  let riskCategory = 'STABLE';
  let riskBadgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  let riskGaugeColor = '#10B981'; // Emerald

  if (totalRiskScore >= 65 || isBackflow || fluidLevel <= 5) {
    riskCategory = 'CRITICAL EMERGENCY';
    riskBadgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    riskGaugeColor = '#EF4444'; // Red
  } else if (totalRiskScore >= 35) {
    riskCategory = 'MODERATE RISK';
    riskBadgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    riskGaugeColor = '#F59E0B'; // Amber
  }

  // ── PREDICTIVE ML METRICS ──
  // A. Predicted Time-to-Depletion (minutes)
  const totalVolumeMl = 1000; // Standard bag size
  const remainingVolumeMl = (totalVolumeMl * (fluidLevel / 100));
  const mlPerMinActual = dropFactor > 0 ? (dripRate / dropFactor) : 0;
  const estimatedTimeMins = mlPerMinActual > 0 ? Math.round(remainingVolumeMl / mlPerMinActual) : Infinity;

  // B. Infiltration / Extravasation AI Probability (%)
  const logitVal = -3.2 + (dripRate * 0.03) + (isBackflow ? 2.5 : 0) + (patientAge > 65 ? 0.8 : 0);
  const infiltrationProbability = Math.round((1 / (1 + Math.exp(-logitVal))) * 100);

  // Preset Scenario Loaders
  const loadScenario = (type) => {
    if (type === 'normal') {
      setFluidLevel(80);
      setDripRate(25);
      setPrescribedRate(100);
      setDropFactor(15);
      setIsBackflow(false);
      setIsHighRiskWard(false);
    } else if (type === 'low_fluid') {
      setFluidLevel(12);
      setDripRate(25);
      setPrescribedRate(100);
      setDropFactor(15);
      setIsBackflow(false);
    } else if (type === 'backflow') {
      setFluidLevel(45);
      setDripRate(0);
      setPrescribedRate(100);
      setIsBackflow(true);
    } else if (type === 'occlusion') {
      setFluidLevel(65);
      setDripRate(0);
      setPrescribedRate(100);
      setIsBackflow(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-ink to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-saline/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-saline/20 text-saline-bright p-2 rounded-xl border border-saline/30">
                <Cpu className="w-6 h-6 animate-pulse" />
              </span>
              <span className="text-xs uppercase tracking-widest font-bold text-saline-bright bg-saline/10 px-3 py-1 rounded-full border border-saline/20">
                AI/ML Predictive Analytics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold">
              What-If IV Risk Simulator
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Test hypothetical infusion parameters. The hybrid ML engine evaluates real-time risk scores, predicts time-to-depletion, and computes infiltration probability.
            </p>
          </div>

          {/* Quick Scenario Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadScenario('normal')}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Normal Infusion
            </button>
            <button
              onClick={() => loadScenario('low_fluid')}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Low Fluid (12%)
            </button>
            <button
              onClick={() => loadScenario('backflow')}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Reverse Flow Crisis
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs AI Results */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Sliders & Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-saline" />
            Hypothetical Telemetry Inputs
          </h3>

          {/* 1. Fluid Level Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-saline" /> IV Fluid Level:
              </label>
              <span className="font-mono font-bold text-saline text-base">{fluidLevel}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fluidLevel}
              onChange={(e) => setFluidLevel(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-saline"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0% (Empty)</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* 2. Drip Rate Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <label className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-500" /> Actual Live Drip Rate:
              </label>
              <span className="font-mono font-bold text-blue-600 text-base">{dripRate} gtt/min</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={dripRate}
              onChange={(e) => setDripRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0 (Stopped)</span>
              <span>Target: {targetGttMin} gtt/min</span>
              <span>120 gtt/min</span>
            </div>
          </div>

          {/* 3. Prescribed Rate & Drop Factor Grid */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Prescribed Rate (mL/hr)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={prescribedRate}
                onChange={(e) => setPrescribedRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-saline/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Drop Factor (gtt/mL)
              </label>
              <select
                value={dropFactor}
                onChange={(e) => setDropFactor(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-saline/20"
              >
                <option value={10}>10 gtt/mL (Macro)</option>
                <option value={15}>15 gtt/mL (Macro Standard)</option>
                <option value={20}>20 gtt/mL (Macro Fine)</option>
                <option value={60}>60 gtt/mL (Micro Drip)</option>
              </select>
            </div>
          </div>

          {/* 4. Reverse Blood Flow Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isBackflow ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-ink dark:text-white">Reverse Blood Backflow Sensor</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Simulate blood entering IV tubing line</p>
              </div>
            </div>

            <button
              onClick={() => setIsBackflow(!isBackflow)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                isBackflow 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isBackflow ? 'BACKFLOW ACTIVE' : 'NORMAL FLOW'}
            </button>
          </div>

          {/* 5. Patient Risk Modifiers */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Patient Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-ink dark:text-white font-mono text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setIsHighRiskWard(!isHighRiskWard)}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  isHighRiskWard
                    ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Heart className="w-4 h-4" /> ICU / High-Risk Ward: {isHighRiskWard ? 'YES' : 'NO'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI/ML Model Output & Risk Analytics (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Risk Gauge Score Box */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-6">
              AI Composite Risk Score Index
            </h3>

            {/* Circular Gauge Score */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={riskGaugeColor}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * totalRiskScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-display font-bold text-ink dark:text-white font-mono">
                  {totalRiskScore}
                </span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">out of 100</span>
              </div>
            </div>

            {/* Risk Category Badge */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border ${riskBadgeColor}`}>
              <Activity className="w-4 h-4 animate-pulse" />
              {riskCategory}
            </div>
          </div>

          {/* Machine Learning Predictions Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-ink dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-saline" />
              Predictive ML Model Inference
            </h4>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">Time to Depletion</span>
                <span className="text-base font-bold text-ink dark:text-white font-mono flex items-center gap-1">
                  <Clock className="w-4 h-4 text-saline" />
                  {estimatedTimeMins === Infinity ? 'N/A (Stopped)' : `${estimatedTimeMins} mins`}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">Infiltration Risk</span>
                <span className="text-base font-bold text-ink dark:text-white font-mono flex items-center gap-1">
                  <Activity className="w-4 h-4 text-amber-500" />
                  {infiltrationProbability}%
                </span>
              </div>
            </div>

            {/* AI Directives Recommendations */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Clinical AI Action Directive:
              </span>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                {isBackflow && (
                  <li className="flex items-start gap-2 text-rose-600 dark:text-rose-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    EMERGENCY: Clamp line immediately and elevate fluid bag 24-36 inches above site.
                  </li>
                )}
                {fluidLevel <= 15 && (
                  <li className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    Prepare replacement IV bag before level reaches 5% to prevent air entry.
                  </li>
                )}
                {rateDeviation > 10 && (
                  <li className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-saline shrink-0 mt-1.5" />
                    Adjust roller clamp. Target rate = {targetGttMin} gtt/min (current = {dripRate} gtt/min).
                  </li>
                )}
                {!isBackflow && fluidLevel > 15 && rateDeviation <= 10 && (
                  <li className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    Infusion parameters are stable within normal physiological boundaries.
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
