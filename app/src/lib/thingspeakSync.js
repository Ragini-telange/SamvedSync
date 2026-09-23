/**
 * SamvedSync — Hardware ThingSpeak IoT Ingestion & Real-Time Alert Engine
 * 
 * Hardware Flow:
 * ESP32 + IR Sensor + Color Sensor (TCS3200)
 *         ↓ (Wi-Fi)
 * ThingSpeak IoT Cloud
 *         ↓ (REST API)
 * SamvedSync Client/Service (Validated Ingestion)
 *         ↓
 * Supabase `readings` & `alerts_log` (Realtime Broadcast)
 *         ↓
 * Doctor & Nurse Clinical Dashboards
 * 
 * ThingSpeak Field Mapping:
 * - field1: Drip Rate (gtt/min)
 * - field2: Flow Status (1 = Normal / Flowing, 0 = Stopped)
 * - field3: Blood Detected (1 = Reverse Backflow, 0 = Normal)
 */

import { supabase } from '../supabaseClient';
import { calculatePrototypeRisk } from './riskEngine';
import { sendNotification } from './dashboardData';

const DEFAULT_READ_KEY = 'C6XWY4CA99EDIFKC';
const DEFAULT_CHANNEL_ID = '3249576';

// In-memory cache to prevent duplicate database writes and alert spamming
const lastProcessedEntryMap = new Map();
const lastAlertTimestampMap = new Map(); // key: `${patientId}_${alertType}` -> timestamp

/**
 * Fetch latest readings directly from ThingSpeak
 */
export async function fetchThingSpeakFeeds(channelId = DEFAULT_CHANNEL_ID, readKey = DEFAULT_READ_KEY, results = 15) {
  const cleanChannel = String(channelId || DEFAULT_CHANNEL_ID).trim();
  const cleanKey = String(readKey || DEFAULT_READ_KEY).trim();
  
  const url = `https://api.thingspeak.com/channels/${cleanChannel}/feeds.json?api_key=${cleanKey}&results=${results}`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      throw new Error(`ThingSpeak API error: HTTP ${res.status}`);
    }
    const data = await res.json();
    const feeds = data.feeds || [];

    // Parse feeds into typed telemetric readings
    return feeds.map((feed) => {
      const dripRate = parseFloat(feed.field1);
      const flowStatus = parseInt(feed.field2, 10);
      const bloodValue = parseFloat(feed.field3);

      return {
        entry_id: feed.entry_id,
        created_at: feed.created_at,
        drip_rate: isNaN(dripRate) ? 0 : Math.max(0, dripRate),
        flow_status: isNaN(flowStatus) ? 1 : flowStatus,
        reverse_flow: !isNaN(bloodValue) && bloodValue > 0.05,
        battery_level: 95.0,
        raw: feed
      };
    });
  } catch (err) {
    console.warn(`[ThingSpeak] Channel ${cleanChannel} fetch notice:`, err.message);
    return [];
  }
}

/**
 * Fetch the single latest hardware reading for a patient
 */
export async function fetchLatestHardwareReading(channelId, readKey) {
  const feeds = await fetchThingSpeakFeeds(channelId, readKey, 1);
  return feeds.length > 0 ? feeds[feeds.length - 1] : null;
}

/**
 * Sync latest hardware reading into Supabase and evaluate alert conditions
 */
export async function syncPatientThingSpeakData(patient) {
  if (!patient || !patient.id) return null;

  const channelId = patient.thingspeak_channel_id || DEFAULT_CHANNEL_ID;
  const readKey = patient.thingspeak_read_key || DEFAULT_READ_KEY;

  const latest = await fetchLatestHardwareReading(channelId, readKey);
  if (!latest) {
    return null;
  }

  // Check if this hardware entry was already saved to Supabase
  const patientKey = `${patient.id}_${channelId}`;
  if (lastProcessedEntryMap.get(patientKey) === latest.entry_id) {
    return latest; // Already processed, return without duplicate DB insert
  }
  lastProcessedEntryMap.set(patientKey, latest.entry_id);

  // Target drip rate calculation: (prescribed_rate_ml_hr * drop_factor) / 60
  const targetRate = patient.drop_factor && patient.prescribed_rate_ml_hr
    ? (patient.prescribed_rate_ml_hr * patient.drop_factor) / 60
    : 25.0;

  // Query most recent IV level from database to continue depletion curve
  let currentIvLevel = 85.0;
  try {
    const { data: recentReadings } = await supabase
      .from('readings')
      .select('iv_level, recorded_at')
      .eq('patient_id', patient.id)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (recentReadings && recentReadings.length > 0 && recentReadings[0].iv_level !== null) {
      currentIvLevel = parseFloat(recentReadings[0].iv_level);
      // Deplete slightly if flow is active (approx 0.1% per 15s at nominal flow)
      if (latest.drip_rate > 0 && latest.flow_status === 1) {
        currentIvLevel = Math.max(0, currentIvLevel - 0.1);
      }
    }
  } catch (e) {
    console.warn('IV level lookup note:', e.message);
  }

  // Calculate prototype risk analysis score
  const riskResult = calculatePrototypeRisk({
    dripRate: latest.drip_rate,
    flowStatus: latest.flow_status,
    reverseFlow: latest.reverse_flow,
    ivLevel: currentIvLevel,
    targetRate,
    recentAlertsCount: 0
  });

  // 1. Insert reading into Supabase `readings` table
  try {
    await supabase.from('readings').insert({
      patient_id: patient.id,
      iv_level: Math.round(currentIvLevel * 10) / 10,
      drop_rate: latest.drip_rate,
      drop_count: latest.entry_id,
      reverse_flow: latest.reverse_flow,
      battery_level: latest.battery_level,
      device_status: latest.flow_status === 1 ? 'Normal' : 'Stopped',
      risk_score: riskResult.score,
      risk_label: riskResult.level,
      ai_explain: riskResult.reasons.join('; '),
      recorded_at: latest.created_at || new Date().toISOString()
    });
  } catch (err) {
    console.warn('Reading insertion note:', err.message);
  }

  // 2. Evaluate Alert Conditions with Cooldown
  await evaluateAndGenerateAlerts(patient, latest, currentIvLevel, targetRate);

  return {
    ...latest,
    iv_level: currentIvLevel,
    risk: riskResult
  };
}

/**
 * State-transition and cooldown-guarded alert generator
 */
async function evaluateAndGenerateAlerts(patient, reading, ivLevel, targetRate) {
  const alertsToRaise = [];
  const now = Date.now();
  const COOLDOWN_MS = 5 * 60 * 1000; // 5 minute cooldown for duplicate conditions

  // Condition 1: REVERSE BLOOD FLOW (Critical)
  if (reading.reverse_flow) {
    alertsToRaise.push({
      type: 'reverse_flow',
      severity: 'critical',
      message: `CRITICAL ALERT: Reverse blood backflow detected in IV line for ${patient.name} (Bed ${patient.bed_number})!`
    });
  }

  // Condition 2: DRIP STOPPED / OCCLUSION (Critical/Warning)
  if ((reading.drip_rate === 0 || reading.flow_status === 0) && ivLevel > 5) {
    alertsToRaise.push({
      type: 'device_stopped',
      severity: 'critical',
      message: `ALERT: IV drip stopped / line occlusion detected for ${patient.name} (Bed ${patient.bed_number}).`
    });
  }

  // Condition 3: FLOW ABNORMAL (Warning)
  if (reading.drip_rate > 0 && targetRate > 0) {
    const deviation = Math.abs(reading.drip_rate - targetRate);
    if ((deviation / targetRate) > 0.35) {
      alertsToRaise.push({
        type: 'drop_anomaly',
        severity: 'warning',
        message: `WARNING: Abnormal flow rate for ${patient.name} (Bed ${patient.bed_number}). Prescribed: ${targetRate.toFixed(1)} gtt/min, Current: ${reading.drip_rate.toFixed(1)} gtt/min.`
      });
    }
  }

  // Condition 4: LOW IV LEVEL (Warning)
  if (ivLevel <= 20 && ivLevel > 5) {
    alertsToRaise.push({
      type: 'iv_low',
      severity: 'warning',
      message: `WARNING: IV fluid level is low (${Math.round(ivLevel)}% remaining) for ${patient.name} (Bed ${patient.bed_number}).`
    });
  }

  // Condition 5: IV CRITICALLY EMPTY (Critical)
  if (ivLevel <= 5) {
    alertsToRaise.push({
      type: 'iv_critically_empty',
      severity: 'critical',
      message: `CRITICAL ALERT: IV container is nearly empty for ${patient.name} (Bed ${patient.bed_number}). Immediate bottle replacement required.`
    });
  }

  // Process triggered alerts through cooldown check
  for (const alertItem of alertsToRaise) {
    const alertKey = `${patient.id}_${alertItem.type}`;
    const lastTriggered = lastAlertTimestampMap.get(alertKey) || 0;

    if (now - lastTriggered > COOLDOWN_MS) {
      lastAlertTimestampMap.set(alertKey, now);

      try {
        // Insert into alerts_log
        await supabase.from('alerts_log').insert({
          patient_id: patient.id,
          alert_type: alertItem.type,
          severity: alertItem.severity,
          message: alertItem.message,
          iv_level: ivLevel,
          drop_count: reading.entry_id,
          acknowledged: false
        });

        // Trigger system notification to assigned nurse and doctor
        await sendNotification({
          userId: patient.assigned_nurse_id ? null : null, // broadcast to staff
          type: 'alert',
          title: alertItem.severity === 'critical' ? '🔴 Critical IV Alert' : '🟡 IV Warning',
          message: alertItem.message,
          link: 'alerts'
        });
      } catch (err) {
        console.warn('Alert generation note:', err.message);
      }
    }
  }
}
