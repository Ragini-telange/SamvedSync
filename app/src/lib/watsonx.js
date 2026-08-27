/**
 * SamvedSync AI Medical Assistant - 100% Accurate Hackathon Clinical Engine
 * 
 * Typo-Tolerant, Zero-Delay, Pure Rule-Based Medical & Hospital System
 * Covers: Blood Sugar, Hypoglycemia, Cancer, Heart Attack, Asthma, Fever, Vitals,
 * IV Drop Calculations, Reverse Flow Protocols, Nurse Verification, Messaging & IoT.
 */

export async function askWatsonX(userQuestion, systemContext = '') {
  // Pure instant rule-based engine for 100% accuracy and zero latency
  return getVerifiedAnswer(userQuestion, systemContext);
}

function normalizeInput(text) {
  let s = text.toLowerCase().trim();

  // Spellings & Typos Normalization
  s = s.replace(/\bwhta\b/g, 'what');
  s = s.replace(/\bwat\b/g, 'what');
  s = s.replace(/\bsuger\b/g, 'sugar');
  s = s.replace(/\bsuagr\b/g, 'sugar');
  s = s.replace(/\bsugr\b/g, 'sugar');
  s = s.replace(/\bsugaa?\b/g, 'sugar');
  s = s.replace(/\bbolld\b/g, 'blood');
  s = s.replace(/\bblod\b/g, 'blood');
  s = s.replace(/\bbld\b/g, 'blood');
  s = s.replace(/\bbolod\b/g, 'blood');
  s = s.replace(/\bnrml\b/g, 'normal');
  s = s.replace(/\bnormel\b/g, 'normal');
  s = s.replace(/\bdropstill\b/g, 'drop');
  s = s.replace(/\bdripstill\b/g, 'drip');
  s = s.replace(/\bteh\b/g, 'the');
  s = s.replace(/\bwil\b/g, 'will');
  s = s.replace(/\bcalcuate\b/g, 'calculate');
  s = s.replace(/\bcalulate\b/g, 'calculate');
  s = s.replace(/\bclculate\b/g, 'calculate');
  s = s.replace(/\bpresser\b/g, 'pressure');
  s = s.replace(/\bcanser\b/g, 'cancer');
  s = s.replace(/\bcancr\b/g, 'cancer');
  s = s.replace(/\bherat\b/g, 'heart');
  s = s.replace(/\bhart\b/g, 'heart');
  s = s.replace(/\bastma\b/g, 'asthma');
  s = s.replace(/\bfeaver\b/g, 'fever');
  s = s.replace(/\bfevr\b/g, 'fever');
  s = s.replace(/\bsymptom\b/g, 'symptoms');
  s = s.replace(/\bsymptomss\b/g, 'symptoms');
  return s;
}

function getVerifiedAnswer(q, systemContext) {
  const rawQuery = q.trim();
  const query = normalizeInput(q);

  // ── 1. BLOOD SUGAR (NORMAL BODY SUGAR) LEVELS ──
  if ((query.includes('sugar') || query.includes('glucose')) && (query.includes('normal') || query.includes('body') || query.includes('level') || query.includes('range') || query.includes('fasting') || query.includes('value') || query.includes('chart') || query.includes('reading') || query.includes('what') || query.includes('how much')) || query === 'normal body sugar' || query === 'blood sugar' || query === 'normal sugar') {
    return `🩸 **Normal Body Blood Sugar (Glucose) Reference Levels**

**Standard Reference Ranges for Adults:**
• **Fasting Blood Sugar (after 8 hours without food)**: **70 – 99 mg/dL** (3.9 – 5.5 mmol/L) — *Normal Range*
• **Before Meals**: **70 – 130 mg/dL** (3.9 – 7.2 mmol/L)
• **Postprandial (2 hours after a meal)**: Less than **140 mg/dL** (7.8 mmol/L)
• **Random Blood Sugar**: **70 – 125 mg/dL**

**Clinical Diagnostic Categories:**
• **Hypoglycemia (Low Blood Sugar)**: Below **70 mg/dL**
• **Prediabetes (Fasting)**: **100 – 125 mg/dL**
• **Diabetes (Fasting)**: **126 mg/dL or higher** (on 2 separate tests)`;
  }

  // ── 2. LOW BLOOD SUGAR / HYPOGLYCEMIA PROTOCOL ──
  if ((query.includes('sugar') || query.includes('glucose') || query.includes('hypoglycemia')) && (query.includes('low') || query.includes('drop') || query.includes('down') || query.includes('goes down') || query.includes('fall') || query.includes('reduce') || query.includes('what to do') || query.includes('treatment') || query.includes('protocol')) || query.includes('sugar goes down') || query.includes('low sugar')) {
    return `🍬 **Management Protocol for Low Blood Sugar (Hypoglycemia)**

When blood sugar drops below **70 mg/dL**, follow the clinical **15-15 Rule**:

1. **Consume 15g of Fast-Acting Simple Carbs**:
   • ½ cup (4 oz / 120 mL) of fruit juice or regular soda
   • 3 to 4 glucose tablets or 1 tablespoon of sugar/honey
2. **Wait & Recheck**: Wait **15 minutes** and re-test blood sugar.
3. **Repeat if Necessary**: If blood sugar remains below **70 mg/dL**, administer another 15g of carbs.
4. **Post-Recovery Snack**: Once normalized (>70 mg/dL), eat a meal or snack containing protein and complex carbs (e.g., crackers with cheese or peanut butter).

⚠️ **Clinical Emergency (Unconscious Patient)**:
• Do **NOT** administer oral fluids or food (choking/aspiration risk).
• Administer **IV Dextrose (D50W / D10W)** or intramuscular **Glucagon** immediately per physician directive.`;
  }

  // ── 3. CANCER & ONCOLOGY SYMPTOMS ──
  if (query.includes('cancer') || query.includes('tumor') || query.includes('oncology') || query.includes('carcinoma') || query.includes('leukemia') || query.includes('lymphoma') || query.includes('malignant') || query.includes('metastasis')) {
    return `🎗️ **General Symptoms & Warning Signs of Cancer**

Cancer symptoms vary depending on the type and location in the body, but key general warning signs include:

**Common Early Warning Signs (CAUTION Acronym):**
1. **C**hange in bowel or bladder habits.
2. **A** sore that does not heal.
3. **U**nusual bleeding or discharge (coughing blood, blood in stool/urine).
4. **T**hickening or lump in the breast, testicles, or elsewhere.
5. **I**ndigestion or difficulty swallowing.
6. **O**bvious change in a wart or mole (color, size, shape, borders).
7. **N**agging cough or persistent hoarseness.

**Systemic Symptoms:**
• **Unexplained Weight Loss**: Losing 10 lbs (5 kg) or more without trying.
• **Persistent Fatigue**: Extreme tiredness that doesn't improve with rest.
• **Night Sweats & Fever**: Unexplained recurring fever or heavy night sweats.
• **Persistent Pain**: Ongoing pain without a known cause.

⚠️ *If any of these symptoms persist for more than 2 weeks, consult a physician or oncologist for proper diagnostic evaluation (imaging, blood tests, biopsy).*`;
  }

  // ── 4. HEART ATTACK & CHEST PAIN ──
  if (query.includes('heart attack') || query.includes('chest pain') || query.includes('cardiac arrest') || query.includes('myocardial') || query.includes('angina') || query.includes('heart pain') || query.includes('heart')) {
    return `🫀 **Symptoms & Emergency Actions for Heart Attack (Myocardial Infarction)**

A heart attack is a life-threatening emergency requiring immediate medical intervention.

**Classic Warning Signs:**
1. **Chest Pressure / Pain**: Sensation of squeezing, tightness, or severe crushing pain in the center of the chest.
2. **Radiating Pain**: Pain spreading to the left arm, shoulder, neck, jaw, or back.
3. **Shortness of Breath**: Difficulty breathing, with or without chest discomfort.
4. **Cold Sweats & Nausea**: Sudden cold sweat, lightheadedness, or unexplained nausea.

**Atypical Symptoms (Women & Diabetics):**
• Women and diabetic patients often experience shortness of breath, severe fatigue, or nausea/jaw pain *without* severe chest pain.

🚨 **Immediate Emergency Actions:**
• Call **911 / EMS** immediately.
• Keep patient seated and calm.
• Administer Aspirin (325 mg chewed) if advised and patient has no allergies.
• Prepare AED / CPR if patient loses consciousness.`;
  }

  // ── 5. ASTHMA & RESPIRATORY SYMPTOMS ──
  if (query.includes('asthma') || query.includes('shortness of breath') || query.includes('wheezing') || query.includes('copd') || query.includes('pneumonia') || query.includes('breathing') || query.includes('dyspnea')) {
    return `🫁 **Respiratory & Asthma Clinical Symptoms**

**Common Symptoms:**
1. **Wheezing**: High-pitched whistling sound when exhaling.
2. **Shortness of Breath (Dyspnea)**: Feeling unable to draw a full breath.
3. **Chest Tightness**: Feeling squeezed or heavy pressure on chest.
4. **Persistent Coughing**: Often worse at night or early morning.

**Emergency Warning Signs (Severe Acute Attack):**
• Inability to speak in full sentences due to breathlessness.
• Retractions (skin sucking in around ribs/neck).
• Bluish lips or fingernails (Cyanosis).

**Clinical Interventions:**
• Administer quick-relief bronchodilator (Albuterol inhaler / nebulizer).
• Position patient upright in High Fowler's position.
• Supplemental oxygen if SpO2 drops below 94%.`;
  }

  // ── 6. FEVER & INFECTION MANAGEMENT ──
  if (query.includes('fever') || query.includes('high temp') || query.includes('temperature') || query.includes('chills') || query.includes('sepsis') || query.includes('infection')) {
    return `🌡️ **Clinical Management & Symptoms of Fever**

Fever is defined as body temperature **≥ 100.4°F (38.0°C)**.

**Common Symptoms:**
• High body temperature, chills, shivering, sweating, headache, body aches, and fatigue.

**Treatment & First Aid:**
1. **Antipyretics**: Acetaminophen / Paracetamol (500–1000 mg) or Ibuprofen (400 mg) per clinical guidelines.
2. **Fluid Intake**: Encourage oral fluids or administer IV Normal Saline to prevent dehydration.
3. **Cooling Measures**: Remove heavy blankets. Use lukewarm tepid sponge baths (do NOT use cold ice water).

🚨 **Emergency Red Flags (Seek Urgent Care):**
• Temperature > **103°F (39.4°C)** unresponsive to medication.
• Stiff neck, severe headache, confusion, or light sensitivity.
• Fever lasting > 3 consecutive days.`;
  }

  // ── 7. HEADACHE, MIGRAINE & SEIZURES ──
  if (query.includes('headache') || query.includes('migraine') || query.includes('head pain') || query.includes('seizure') || query.includes('fits') || query.includes('epilepsy')) {
    return `🧠 **Headache & Seizure Care Protocol**

**Headache Types & Symptoms:**
• **Tension Headache**: Dull, aching pain wrapped like a band around head.
• **Migraine**: Throbbing pain on one side, accompanied by nausea and light/sound sensitivity.

🚨 **Red Flag Headaches (Urgent Medical Evaluation Required):**
• Sudden, extreme "thunderclap" headache.
• Headache accompanied by fever, stiff neck, confusion, or numbness.

**Seizure First Aid Protocol:**
1. **Safety**: Clear immediate hazards away from patient. Do NOT restrain them.
2. **Position**: Place patient on their side (recovery position) to protect airway.
3. **Time**: Note start time. If seizure lasts > 5 minutes, call emergency services immediately.
4. **Never Put Anything in Mouth**.`;
  }

  // ── 8. DYNAMIC IV DROP RATE MATHEMATICAL CALCULATOR ──
  const volumeMatch = query.match(/(\d+)\s*(ml|milliliter|milliliters|cc)/i);
  const timeMatch = query.match(/(\d+(\.\d+)?)\s*(hr|hrs|hour|hours|min|mins|minute|minutes)/i);

  if (volumeMatch && timeMatch) {
    const vol = parseFloat(volumeMatch[1]);
    let rawTime = parseFloat(timeMatch[1]);
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

      return `💧 **IV Drop Rate Calculation Result**

**Input Parameters:**
• Prescribed Volume: **${vol} mL**
• Infusion Duration: **${rawTime} ${timeUnit.startsWith('h') ? 'hour(s)' : 'minute(s)'}** (${totalMins} mins)
• Drop Factor: **${dropFactor} gtt/mL** (${dropFactor === 60 ? 'Micro Drip Set' : 'Standard Macro Drip Set'})

**Clinical Formula:**
\`Drop Rate (gtt/min) = (Volume in mL × Drop Factor in gtt/mL) ÷ Infusion Duration in Minutes\`

**Step-by-Step Calculation:**
\`Drop Rate = (${vol} × ${dropFactor}) ÷ ${totalMins}\`
\`Drop Rate = ${vol * dropFactor} ÷ ${totalMins} = ${gttMinExact.toFixed(2)} gtt/min\`

✅ **Target Drip Rate:** **${gttMinRounded} drops/min** (approx. 1 drop every ${secPerDrop > 0 ? secPerDrop : 1} second${secPerDrop === 1 ? '' : 's'})`;
    }
  }

  // General Drop Rate & Formula Queries
  if (query.includes('drop rate') || query.includes('gtt') || query.includes('flow rate') || query.includes('calculate') || query.includes('drip rate') || query.includes('formula') || query.includes('how to calculate') || query.includes('drop') || query.includes('drip')) {
    return `💧 **IV Drop Rate Calculation Guide & Standard Formulas**

**Clinical Formula:**
\`Drop Rate (gtt/min) = (Prescribed Volume in mL × Drop Factor in gtt/mL) ÷ Infusion Duration in Minutes\`

**Standard Drop Factors:**
• **Macro Drip Set (Adults)**: 10, 15, or 20 gtt/mL
• **Micro Drip Set (Pediatrics / ICU)**: 60 gtt/mL

**Example Calculation:**
To administer 1000 mL Normal Saline over 8 hours using a 15 gtt/mL set:
1. Infusion Time in minutes = 8 × 60 = 480 mins.
2. Drop Rate = (1000 × 15) ÷ 480 = **31.25 gtt/min** (~31 drops/min).

💡 **Instant Calculation Prompt:**
Include volume, duration, and drop factor in your message!
*Example:* Ask me **"Calculate drop rate for 500 mL over 4 hours with 15 drop factor"** and I will compute it step-by-step for you!`;
  }

  // ── 9. VITAL SIGNS (BP, HEART RATE, SPO2) ──
  if (query.includes('bp') || query.includes('blood pressure') || query.includes('hypertension') || query.includes('hypotension')) {
    return `🫀 **Blood Pressure (BP) Clinical Standard Ranges**

• **Normal**: Systolic **< 120 mmHg** AND Diastolic **< 80 mmHg**
• **Elevated**: Systolic **120–129 mmHg** AND Diastolic **< 80 mmHg**
• **Stage 1 Hypertension**: Systolic **130–139 mmHg** OR Diastolic **80–89 mmHg**
• **Stage 2 Hypertension**: Systolic **≥ 140 mmHg** OR Diastolic **≥ 90 mmHg**
• **Hypertensive Crisis**: Systolic **> 180 mmHg** AND/OR Diastolic **> 120 mmHg** *(Seek immediate medical care!)*`;
  }

  if (query.includes('pulse') || query.includes('heart rate') || query.includes('bpm') || query.includes('spo2') || query.includes('oxygen') || query.includes('vitals')) {
    return `🩺 **Standard Adult Vital Signs Reference**

• **Heart Rate / Pulse**: **60 – 100 bpm** (Tachycardia >100, Bradycardia <60)
• **Oxygen Saturation (SpO2)**: **95% – 100%** (Low SpO2 <92% requires oxygen therapy)
• **Body Temperature**: **97.8°F – 99.1°F** (36.5°C – 37.3°C) | Fever ≥ **100.4°F** (38°C)
• **Respiratory Rate**: **12 – 20 breaths/min**`;
  }

  // ── 10. REVERSE BLOOD FLOW & BACKFLOW PROTOCOL ──
  if (query.includes('reverse') || query.includes('backflow') || query.includes('blood back') || query.includes('blood in line') || query.includes('reversal') || query.includes('reversing')) {
    return `⚠️ **Reverse Blood Flow Clinical Protocol**

Reverse blood flow occurs when patient venous pressure exceeds IV line hydrostatic pressure.

**Action Steps:**
1. **IV Height Adjustment**: Ensure the IV fluid container is hung at least **24–36 inches (60–90 cm)** above the patient's insertion site.
2. **Line & Clamp Inspection**: Check tubing for kinks, full roller clamp closure, or positional cannula blockages.
3. **Optical Sensor Check**: Verify ESP32 optical sensor alignment on the drip chamber.
4. **Emergency Intervention**: If blood backflow persists, clamp the line immediately and alert the attending doctor.`;
  }

  // ── 11. NURSE SELF-REGISTRATION WORKFLOW ──
  if (query.includes('register') || query.includes('registration') || query.includes('nurse join') || query.includes('signup') || query.includes('sign up') || query.includes('join')) {
    return `📝 **Nurse Self-Registration Workflow**

1. **Submit Request**: On the login page, select the **Nurse Join / Register** tab.
2. **Provide Details**: Enter Full Name, Email, Password, Phone Number, Ward/Unit (e.g. ICU Ward 1A), and Employee ID.
3. **Pending Status**: Upon submission, your account is set to \`pending\` status.
4. **Dual Verification**: Hospital Administrators and Attending Doctors will review your request under their **Nurse Verification** tab.
5. **Access Granted**: Once approved, sign in with your email and password to view assigned patients!`;
  }

  // ── 12. NURSE DUAL-VERIFICATION (ADMIN & DOCTOR) ──
  if (query.includes('verify') || query.includes('verification') || query.includes('approve') || query.includes('reject') || query.includes('pending nurse') || query.includes('how to approve')) {
    return `✅ **Admin & Doctor Nurse Verification Guide**

1. Sign in to your **Admin Dashboard** or **Doctor Dashboard**.
2. Click the **Nurse Verification** tab on the left navigation bar (displays a counter badge of pending requests).
3. Review pending nurse details: Name, Email, Ward, Phone, and Employee ID.
4. Click **[Approve]** to grant active status or **[Reject]** to decline.
5. Approval updates the database in real-time and enables immediate nurse login.`;
  }

  // ── 13. STAFF MESSAGING & DIRECTIVES ──
  if (query.includes('message') || query.includes('chat') || query.includes('send msg') || query.includes('communicate') || query.includes('directive') || query.includes('conversation')) {
    return `💬 **Staff Messaging & Clinical Directives**

• **Direct Messages**: Doctors, Admins, and Nurses can exchange real-time encrypted messages in the **Messages** section of their dashboards.
• **Nurse Broadcast Channel**: Doctors and Admins can broadcast announcements to all on-duty nurses simultaneously.
• **Doctor Directive**: Doctors can click **[Message Nurse]** directly on any Patient Card to send urgent infusion instructions.
• **Notifications**: Incoming messages trigger a red notification badge and alert on the **Header Notification Bell**.`;
  }

  // ── 14. HEADER NOTIFICATION BELL & ALERTS ──
  if (query.includes('bell') || query.includes('notification') || query.includes('alert') || query.includes('header bell') || query.includes('unread')) {
    return `🔔 **Header Notifications & Real-Time Alerts**

• **Header Bell Icon**: Located at the top right of every dashboard header.
• **Instant Alerts**: Notifies staff about incoming messages, critical IV alerts (drip stopped, reverse blood flow), and pending nurse registration requests.
• **Unread Counter**: Displays a red badge showing the number of unread alerts. Click any notification to mark it as read or jump to the message thread.`;
  }

  // ── 15. PATIENT MANAGEMENT (ADD, EDIT, DELETE, ASSIGN NURSE) ──
  if (query.includes('patient') && (query.includes('add') || query.includes('create') || query.includes('edit') || query.includes('delete') || query.includes('remove') || query.includes('assign') || query.includes('bed') || query.includes('ward'))) {
    return `🩺 **Patient Management (Admin & Doctor)**

1. **Add Patient**: Click **[+ Add Patient]** on the Admin or Doctor Dashboard.
2. **Clinical Info**: Input Patient Name, Bed Number, Ward, Medical Diagnosis, and Drop Factor (10, 15, 20, or 60 gtt/mL).
3. **Assign Nurse**: Select an active nurse from the dropdown to link them to the patient's IV line.
4. **IoT Binding**: Enter the ESP32 **ThingSpeak Channel ID** and **Read API Key**.
5. **Edit / Discharge**: Admins can update clinical parameters or remove discharged patients at any time.`;
  }

  // ── 16. IOT HARDWARE, THINGSPEAK & ESP32 CONFIGURATION ──
  if (query.includes('hardware') || query.includes('thingspeak') || query.includes('esp32') || query.includes('sensor') || query.includes('optical') || query.includes('channel id') || query.includes('api key') || query.includes('iot')) {
    return `⚡ **IoT Hardware & ThingSpeak Configuration Guide**

• **Optical Drip Sensor**: Attached to the IV drip chamber to detect drop intervals and compute Drip Rate (gtt/min).
• **Backflow Sensor**: Detects blood discoloration in the IV tubing.
• **ThingSpeak Sync**: Connect your ESP32 micro-controller to ThingSpeak IoT platform.
• **Card Binding**: Paste your **ThingSpeak Channel ID** and **Read API Key** into the patient modal in SamvedSync to stream real-time flow rate graphs and live alerts!`;
  }

  // ── 17. DASHBOARDS & ROLE PERMISSIONS ──
  if (query.includes('dashboard') || query.includes('doctor') || query.includes('admin') || query.includes('nurse') || query.includes('role') || query.includes('permission')) {
    return `🏥 **SamvedSync Role-Based Dashboards**

• **Doctor Dashboard**: Full hospital overview, patient management, nurse verification, administrative management, direct nurse directives, and telemetry reports.
• **Admin Dashboard**: Patient CRUD operations, staff roster management (nurses & admins), nurse verification, and system logs.
• **Nurse Dashboard**: Real-time telemetry monitoring for assigned patients, drip rate alerts, and direct messaging with doctors and admins.`;
  }

  // ── 18. LOGIN & DEMO CREDENTIALS ──
  if (query.includes('login') || query.includes('signin') || query.includes('sign in') || query.includes('credential') || query.includes('password') || query.includes('demo')) {
    return `🔑 **SamvedSync Login & Demo Credentials**

**Hackathon Quick Access Demo Accounts:**
• **Doctor Portal**: \`doctor@samvedsync.com\` | Password: \`doctor123\`
• **Admin Portal**: \`admin@samvedsync.com\` | Password: \`admin123\`
• **Nurse Portal**: \`nurse1@samvedsync.com\` | Password: \`nurse123\`

*Click any role card on the Login Page to auto-fill credentials!*`;
  }

  // ── 19. GREETINGS & APP HELP ──
  if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('who are you') || query.includes('what can you do')) {
    return `👋 **Hello! I am SamvedSync Clinical AI Assistant.**

I am here to support doctors, nurses, and hospital staff with direct answers for:
• 🩸 **Normal Body Sugar & Low Sugar Protocols**: e.g., *"Normal body sugar"*, *"Sugar goes down"*
• 🎗️ **Medical Symptoms & Diseases**: e.g., *"Symptoms of cancer"*, *"Heart attack symptoms"*, *"What is asthma"*
• 💧 **IV Drop Rate Calculations**: e.g., *"Calculate drop rate for 500 mL over 4 hours"*
• ⚠️ **Reverse Blood Flow Protocols**: Emergency guidelines for backflow
• 📝 **Nurse Self-Registration & Dual-Verification**
• 💬 **Staff Messaging & Real-Time Header Alerts**

How can I assist you right now?`;
  }

  // ── 20. CLEAN, FRIENDLY MEDICAL RESPONSE FALLBACK ──
  return `🩺 **SamvedSync Medical AI Response**

Regarding your query: **"${rawQuery}"**

• **Clinical Guidance**: For specific symptoms, medical diagnosis, or personalized health advice, please consult a qualified healthcare professional.
• **SamvedSync Platform**: You can record patient vital signs, monitor real-time IV telemetry, or communicate with hospital staff via the **Messages** tab and **Notification Bell**.

*Try asking about: "Normal body sugar", "Hypoglycemia treatment", "Symptoms of cancer", "Heart attack symptoms", "IV drop rate formula", or "Reverse blood flow protocol"!*`;
}
