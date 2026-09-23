/**
 * SamvedSync IV Assistant
 * 
 * Domain-Restricted Assistant for SamvedSync Smart IV Drip Monitoring System.
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Strictly restricted to IV monitoring, drip rate, IV level, flow status, reverse blood flow,
 *    alerts, active patient monitoring data in system, timeline, risk analysis, and project functionality.
 * 2. Controlled Refusal for Medical Diagnosis/Treatment:
 *    "I can provide SamvedSync monitoring information, but I cannot provide medical diagnosis or treatment advice."
 * 3. Controlled Refusal for Unrelated Queries:
 *    "I can only answer questions related to SamvedSync IV monitoring and the information available in this system."
 * 4. Never fabricates patient data.
 */

export async function askWatsonX(userQuestion, systemContext = '') {
  return getVerifiedAnswer(userQuestion, systemContext);
}

function normalizeInput(text) {
  let s = text.toLowerCase().trim();
  s = s.replace(/\bwhta\b/g, 'what');
  s = s.replace(/\bwat\b/g, 'what');
  s = s.replace(/\bbolld\b/g, 'blood');
  s = s.replace(/\bblod\b/g, 'blood');
  s = s.replace(/\bbld\b/g, 'blood');
  s = s.replace(/\bcalcuate\b/g, 'calculate');
  s = s.replace(/\bcalulate\b/g, 'calculate');
  s = s.replace(/\bclculate\b/g, 'calculate');
  s = s.replace(/\bdropstill\b/g, 'drop');
  s = s.replace(/\bdripstill\b/g, 'drip');
  return s;
}

function getVerifiedAnswer(q, systemContext) {
  const rawQuery = q.trim();
  const query = normalizeInput(q);

  // ── 1. CONTROLLED REFUSAL: MEDICAL DIAGNOSIS / TREATMENT ADVICE ──
  // Check if query is asking for disease diagnosis, prescription, medical treatment, or personal health diagnosis
  const medicalDiagnosisKeywords = [
    'cancer', 'tumor', 'heart attack', 'cardiac arrest', 'asthma', 'pneumonia', 
    'fever treatment', 'prescribe', 'prescription', 'what medicine', 'cure', 
    'diagnose me', 'my symptoms', 'stroke', 'covid', 'covid-19', 'diabetes treatment',
    'headache cure', 'infection cure', 'antibiotic'
  ];

  for (const kw of medicalDiagnosisKeywords) {
    if (query.includes(kw)) {
      return `🩺 **Medical Advice Notice**\n\nI can provide SamvedSync monitoring information, but I cannot provide medical diagnosis or treatment advice.\n\nPlease consult an attending physician or medical specialist for diagnosis, treatment decisions, and prescription advice.`;
    }
  }

  // ── 2. REVERSE BLOOD FLOW & BACKFLOW SENSING ──
  if (query.includes('reverse') || query.includes('backflow') || query.includes('blood back') || query.includes('blood flow') || query.includes('tcs3200') || query.includes('blood in tube') || query.includes('blood in line')) {
    return `⚠️ **Reverse Blood Flow in SamvedSync**

• **Hardware Detection**: The hardware utilizes a TCS3200 optical color sensor attached to the IV tubing. When venous blood backs up into the cannula line, the sensor detects the color change and transmits a high signal (\`field3 = 1.0\`) over Wi-Fi via ThingSpeak.
• **Instant Alert**: SamvedSync generates a **Critical Alert** (*REVERSE BLOOD FLOW*) with audible and visual indicators on the Doctor and Nurse dashboards.
• **Clinical Action Protocol**:
  1. Immediately check IV height (fluid bag must be 24–36 inches above insertion site).
  2. Inspect tubing for positional blockages or kinks.
  3. Clamp the line if backflow persists and alert attending medical staff.`;
  }

  // ── 3. DROP RATE CALCULATIONS (INTERACTIVE & STEP-BY-STEP) ──
  const volMatch = query.match(/(\d+)\s*(ml|cc)/i);
  const timeMatch = query.match(/(\d+(\.\d+)?)\s*(hour|hr|minute|min)s?/i);

  if (volMatch && timeMatch) {
    const vol = parseFloat(volMatch[1]);
    const rawTime = parseFloat(timeMatch[1]);
    const timeUnit = timeMatch[3].toLowerCase();
    
    let totalMins = rawTime;
    if (timeUnit.startsWith('h')) {
      totalMins = rawTime * 60;
    }

    let dropFactor = 15; // default macro
    if (query.includes('micro') || query.includes('60')) {
      dropFactor = 60;
    } else if (query.includes('10')) {
      dropFactor = 10;
    } else if (query.includes('20')) {
      dropFactor = 20;
    }

    if (totalMins > 0) {
      const gttMinExact = (vol * dropFactor) / totalMins;
      const gttMinRounded = Math.round(gttMinExact);
      const secPerDrop = Math.round(60 / gttMinExact);

      return `💧 **IV Drop Rate Calculation**

**Parameters:**
• Volume: **${vol} mL**
• Duration: **${rawTime} ${timeUnit.startsWith('h') ? 'hour(s)' : 'minute(s)'}** (${totalMins} min)
• Drop Factor: **${dropFactor} gtt/mL** (${dropFactor === 60 ? 'Micro' : 'Macro'} Drip Set)

**Clinical Formula:**
\`Drop Rate (gtt/min) = (Volume in mL × Drop Factor in gtt/mL) ÷ Duration in Minutes\`

**Calculation:**
\`Drop Rate = (${vol} × ${dropFactor}) ÷ ${totalMins} = ${gttMinExact.toFixed(2)} gtt/min\`

✅ **Target Drip Rate:** **${gttMinRounded} drops/min** (~1 drop every ${secPerDrop > 0 ? secPerDrop : 1}s)`;
    }
  }

  // General Drop Rate & Formula
  if (query.includes('drop rate') || query.includes('gtt') || query.includes('calculate') || query.includes('drip rate') || query.includes('formula') || query.includes('how to calculate')) {
    return `💧 **IV Drop Rate Formula & Clinical Standards**

**Standard Formula:**
\`Drop Rate (gtt/min) = (Prescribed Volume in mL × Drop Factor in gtt/mL) ÷ Infusion Duration in Minutes\`

**Common Drop Factors:**
• **Macro Drip Set (Adults)**: 10, 15, or 20 gtt/mL
• **Micro Drip Set (Pediatric / ICU)**: 60 gtt/mL

**Example:**
For 1000 mL infused over 8 hours (480 mins) with a 15 gtt/mL set:
\`(1000 × 15) ÷ 480 = 31.25 ≈ 31 drops/min\`

💡 *Tip:* Ask me: *"Calculate drop rate for 500 mL over 4 hours with 15 drop factor"* and I will calculate it step-by-step!`;
  }

  // ── 4. FLOW STATUS & DRIP RATE HARDWARE SENSING ──
  if (query.includes('flow status') || query.includes('drip stopped') || query.includes('optical sensor') || query.includes('ir sensor') || query.includes('how does hardware work') || query.includes('esp32') || query.includes('thingspeak')) {
    return `⚡ **Hardware-to-Software Telemetry Architecture**

In SamvedSync, telemetry is streamed directly from physical hardware:
1. **ESP32 Microcontroller**: Controls optical IR sensor and TCS3200 color sensor.
2. **Wi-Fi Transmission**: ESP32 connects to local hospital Wi-Fi and pushes telemetry every 15 seconds to ThingSpeak:
   • **Field 1**: Drip Rate (gtt/min)
   • **Field 2**: Flow Status (1 = Normal/Flowing, 0 = Stopped)
   • **Field 3**: Blood Detection (0.0 = Normal, 1.0 = Reverse Blood Flow)
3. **ThingSpeak Channel \`3249576\`**: Serves as the high-availability IoT ingestion hub.
4. **Supabase & Web App**: Real-time polling and synchronization update patient records, populate SVG telemetry trend lines, and trigger emergency alerts automatically.`;
  }

  // ── 5. AI RISK ANALYSIS (TRANSPARENT PROTOTYPE RULE-BASED ENGINE) ──
  if (query.includes('risk') || query.includes('algorithm') || query.includes('scoring') || (/\bai\b/.test(query) && (query.includes('risk') || query.includes('score') || query.includes('analysis')))) {
    return `📊 **AI-Assisted Risk Analysis — Prototype Engine**

SamvedSync uses an objective, rule-based clinical scoring engine with zero black-box fabrication:

**Scoring Weights:**
• **Reverse Blood Flow**: **+50 points** (Immediate high risk)
• **Flow Stopped / Occlusion**: **+30 points** (Line blockage or closed clamp)
• **Low IV Fluid (≤ 10%)**: **+20 points** (Air embolism risk if bag empties)
• **Abnormal Flow Rate (> 30% deviation)**: **+15 points** (Under/over-infusion)
• **Repeated Recent Alerts**: **+10 points** (Persistent instability)

**Classification Categories:**
• **0 – 20**: 🟢 **LOW RISK** (Infusion stable)
• **21 – 50**: 🟡 **MEDIUM RISK** (Requires nurse attention)
• **51 – 100**: 🔴 **HIGH RISK** (Immediate clinical intervention required)

⚠️ *Label: AI-Assisted Risk Analysis — Prototype. Evaluates multi-parameter telemetry rules to assist clinical workflows.*`;
  }

  // ── 6. WHAT-IF SIMULATOR ──
  if (query.includes('simulator') || query.includes('what if') || query.includes('simulation') || query.includes('hypothetical')) {
    return `🧪 **What-If Infusion Simulator**

• **Purpose**: Enables doctors and nurses to test hypothetical flow adjustments and estimate time-to-depletion before modifying the physical infusion line.
• **Key Notice**: Prominently marked as **"SIMULATION — NOT REAL SENSOR DATA"**.
• **Real vs Simulated**: Real sensor telemetry (drop rate, flow status, reverse blood flow) is fetched live from ESP32 hardware via Wi-Fi. The simulator is strictly a planning tool for volume and rate calculations.`;
  }

  // ── 7. ACTIVE PATIENTS & BED TELEMETRY ──
  if (query.includes('patient') || query.includes('bed') || query.includes('shruti') || query.includes('assigned') || query.includes('monitoring')) {
    if (systemContext) {
      return `🏥 **Current System Patient Monitoring Context**\n\n${systemContext}\n\n• **Access Rules**: Doctors view all patients across the hospital. Nurses view only their assigned patients under "My Assigned Patients".\n• Click any patient card to open the complete Patient Monitoring View with live telemetry, drip rate history graphs, alerts log, and clinical risk analysis.`;
    }
    return `🏥 **Patient Monitoring in SamvedSync**\n\nActive patients are monitored with live ThingSpeak telemetry linked to their assigned bed and IV line. Attending clinicians can monitor drip rates in real time, review alert logs, and inspect rule-based risk analyses.`;
  }

  // ── 8. ALERTS & COOLDOWN LOGIC ──
  if (query.includes('alert') || query.includes('notification') || query.includes('cooldown') || query.includes('alarm')) {
    return `🔔 **SamvedSync Real-Time Alert System**

• **Auto-Generated Alerts**: Triggered upon state changes in telemetry:
  - 🔴 **DRIP STOPPED**: When drip rate drops to 0 while fluid remains.
  - 🔴 **REVERSE BLOOD FLOW**: When TCS3200 sensor detects blood backflow.
  - 🟡 **FLOW ABNORMAL**: When drip rate deviates >30% from prescribed target.
  - 🟡 **LOW IV LEVEL**: When bag level drops to ≤10%.
  - 🟢 **IV COMPLETED**: When volume is fully infused.
• **Duplicate Prevention**: A 5-minute cooldown per alert type prevents duplicate alert spamming while keeping clinicians informed.`;
  }

  // ── 9. SYSTEM ROLES & ACCESS CONTROL ──
  if (query.includes('role') || query.includes('admin') || query.includes('doctor') || query.includes('nurse') || query.includes('login') || query.includes('permission')) {
    return `👥 **SamvedSync Role-Based Access**

• **Admin**: Hospital administration, patient/doctor/nurse management, nurse verification (Approve/Reject), alert logs, and system reports. (No clinical decision-making or simulator).
• **Doctor**: Views all hospital patients, full telemetry graphs, prototype risk analysis, what-if simulator, nurse messaging, and clinical directives.
• **Nurse**: Dedicated "My Assigned Patients" view, patient card monitoring, real-time alert notifications, and doctor communication.`;
  }

  // ── 10. GREETINGS & CAPABILITIES ──
  if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('who are you') || query.includes('help')) {
    return `👋 **Hello! I am SamvedSync IV Assistant.**

I am here to assist with:
• 💧 **IV Drop Rate Calculations**: e.g., *"Calculate drop rate for 500 mL over 4 hours with 15 drop factor"*
• ⚠️ **Reverse Blood Flow & Sensor Protocols**: Optical sensor hardware & emergency actions
• ⚡ **Hardware Telemetry & ThingSpeak Integration**: ESP32 Wi-Fi architecture
• 📊 **Prototype Risk Analysis**: Scoring breakdown and factor explanation
• 🧪 **What-If Simulator**: Comparison of prescribed vs simulated rates
• 🔔 **Hospital Alerts & Patient Monitoring Status**

What would you like to check?`;
  }

  // ── 11. CONTROLLED REFUSAL: UNRELATED GENERAL QUERIES ──
  return `ℹ️ I can only answer questions related to SamvedSync IV monitoring and the information available in this system.

You can ask me about:
• IV drop rate calculations (e.g., *"Calculate drop rate for 1000 mL in 8 hours"*)
• Reverse blood flow detection & safety protocols
• ESP32 & ThingSpeak hardware telemetry
• Prototype risk analysis scoring & alerts
• Active patient monitoring and clinical directives`;
}
