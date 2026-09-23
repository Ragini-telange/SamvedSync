/**
 * SamvedSync — AI-Assisted Risk Analysis (Prototype)
 * 
 * Transparent, deterministic rule-based clinical scoring engine.
 * NOTE: This is a prototype system designed for real-time risk indication.
 * It is NOT clinically validated, does NOT diagnose patients, and does NOT
 * replace professional medical assessment.
 */

export function calculatePrototypeRisk({
  dripRate = 0,
  flowStatus = 1, // 1: normal, 0: stopped
  reverseFlow = false, // boolean or 1/0
  ivLevel = 100, // percentage 0 - 100
  targetRate = 25, // expected gtt/min
  recentAlertsCount = 0
}) {
  let score = 0;
  const factors = [];
  const reasons = [];

  // Factor 1: Reverse Blood Flow (+50)
  const isReverseFlow = reverseFlow === true || reverseFlow === 1 || reverseFlow === '1';
  if (isReverseFlow) {
    score += 50;
    factors.push('Reverse Blood Flow');
    reasons.push('Blood detected entering IV tubing (High danger of catheter thrombosis/infection)');
  }

  // Factor 2: Flow Stopped (+30)
  const isStopped = flowStatus === 0 || flowStatus === '0' || Number(dripRate) === 0;
  if (isStopped && ivLevel > 5) {
    score += 30;
    factors.push('Flow Stopped / Line Occlusion');
    reasons.push('Infusion rate is zero while IV fluid remains in bottle');
  }

  // Factor 3: Low IV Level (+20)
  if (Number(ivLevel) <= 20 && Number(ivLevel) > 0) {
    score += 20;
    factors.push('Low IV Fluid Level');
    reasons.push(`IV container volume is critically low (${Math.round(ivLevel)}% remaining)`);
  } else if (Number(ivLevel) <= 0) {
    score += 25;
    factors.push('IV Depleted');
    reasons.push('IV container is completely empty');
  }

  // Factor 4: Flow Rate Abnormal (+15)
  if (!isStopped && targetRate > 0) {
    const rateDiff = Math.abs(Number(dripRate) - Number(targetRate));
    const percentDev = (rateDiff / Number(targetRate)) * 100;
    if (percentDev > 30) {
      score += 15;
      factors.push('Abnormal Flow Deviation');
      reasons.push(`Current drip rate (${dripRate} gtt/min) deviates by ${Math.round(percentDev)}% from prescribed rate (${targetRate} gtt/min)`);
    }
  }

  // Factor 5: Repeated Recent Alerts (+10)
  if (recentAlertsCount >= 2) {
    score += 10;
    factors.push('Repeated Alerts');
    reasons.push(`${recentAlertsCount} alerts logged within the monitoring window`);
  }

  // Clamp score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Level: 0–20 = LOW, 21–50 = MEDIUM, 51+ = HIGH
  let level = 'LOW';
  let badgeColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  let gaugeColor = '#10B981';

  if (finalScore >= 51 || isReverseFlow) {
    level = 'HIGH';
    badgeColor = 'text-rose-600 bg-rose-500/10 border-rose-500/20';
    gaugeColor = '#EF4444';
  } else if (finalScore >= 21) {
    level = 'MEDIUM';
    badgeColor = 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    gaugeColor = '#F59E0B';
  }

  return {
    score: finalScore,
    level,
    badgeColor,
    gaugeColor,
    factors,
    reasons: reasons.length > 0 ? reasons : ['Infusion parameters within safe operational limits'],
    label: 'AI-Assisted Risk Analysis — Prototype',
    disclaimer: 'Prototype Risk Analysis — For clinical situational awareness only. Not medically validated or diagnostic.'
  };
}

export const calculateRiskScore = calculatePrototypeRisk;

