import { createClient } from '@supabase/supabase-js';
import { calculatePrototypeRisk } from '../src/lib/riskEngine.js';
import { askWatsonX } from '../src/lib/watsonx.js';

const SUPABASE_URL = 'https://pccpvrdcnzktnrsgdqwl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjY3B2cmRjbnprdG5yc2dkcXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTUyMDIsImV4cCI6MjEwMzIzMTIwMn0.o2ItbSmrC944AoisfJqOSyCXhdUrAKmq4fAUwxIHuQ8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('====================================================');
console.log('SAMVEDSYNC END-TO-END VERIFICATION SUITE');
console.log('====================================================\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // TEST 1: ThingSpeak Hardware Fetch (Channel 3249576)
  console.log('\n--- 1. IoT Hardware (ThingSpeak Wi-Fi) Telemetry ---');
  try {
    const res = await fetch('https://api.thingspeak.com/channels/3249576/feeds.json?results=2');
    const data = await res.json();
    assert(data && data.channel && data.channel.id === 3249576, 'ThingSpeak Channel 3249576 is reachable');
    assert(data.feeds && data.feeds.length > 0, 'ThingSpeak returns live feeds');
    const latest = data.feeds[data.feeds.length - 1];
    console.log(`    Latest Feed Data: Drip Rate (field1) = ${latest.field1}, Flow Status (field2) = ${latest.field2}, Blood Detected (field3) = ${latest.field3}`);
    assert(latest.field1 !== undefined, 'field1 (Drip Rate) present');
    assert(latest.field2 !== undefined, 'field2 (Flow Status) present');
    assert(latest.field3 !== undefined, 'field3 (Reverse Blood Flow) present');
  } catch (err) {
    assert(false, `ThingSpeak fetch failed: ${err.message}`);
  }

  // TEST 2: Live Supabase Authentication & Database Verification
  console.log('\n--- 2. Supabase Live Database Verification ---');
  try {
    // Authenticate as Admin
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'admin@samvedsync.com',
      password: 'admin123'
    });
    assert(!authErr && authData.user, 'Supabase authentication successful for Admin');

    // Patients
    const { data: patients, error: pErr } = await supabase
      .from('patients')
      .select('id, name, bed_number, is_active, thingspeak_channel_id, assigned_nurse_id');
    assert(!pErr && patients?.length > 0, `Patients loaded (${patients?.length} found)`);
    const shruti = patients?.find(p => p.name === 'Shruti');
    assert(shruti && shruti.bed_number === '3B-10', 'Patient Shruti mapped to Bed 3B-10');

    // Doctors
    const { data: doctors, error: dErr } = await supabase
      .from('doctors')
      .select('id, specialization, profiles(name, role)');
    assert(!dErr && doctors?.length > 0, `Doctors loaded (${doctors?.length} found)`);
    console.log(`    Doctors in system: ${doctors?.map(d => d.profiles?.name || 'Doctor').join(', ')}`);

    // Nurses
    const { data: nurses, error: nErr } = await supabase
      .from('nurses')
      .select('id, ward, status, profiles(name, role)');
    assert(!nErr && nurses?.length > 0, `Nurses loaded (${nurses?.length} found)`);
    const approvedNurse = nurses?.find(n => n.status === 'approved');
    assert(!!approvedNurse, `Approved nurse available: ${approvedNurse?.profiles?.name}`);

    // Alerts Log
    const { data: alerts, error: aErr } = await supabase
      .from('alerts_log')
      .select('id, alert_type, severity, acknowledged')
      .limit(5);
    assert(!aErr, `Alerts log table queried (${alerts?.length} recent alerts)`);
  } catch (err) {
    assert(false, `Supabase DB query error: ${err.message}`);
  }

  // TEST 3: Prototype Rule-Based Risk Engine Math
  console.log('\n--- 3. Prototype Rule-Based Risk Engine Tests ---');
  // Normal scenario
  const normalRisk = calculatePrototypeRisk({
    dripRate: 25,
    flowStatus: 1,
    reverseFlow: false,
    ivLevel: 80,
    targetRate: 25,
    recentAlertsCount: 0
  });
  assert(normalRisk.score === 0 && normalRisk.level === 'LOW', 'Normal infusion evaluates to 0 (LOW RISK)');

  // Medium Risk scenario (Low level + abnormal deviation = 20 + 15 = 35)
  const mediumRisk = calculatePrototypeRisk({
    dripRate: 40,
    flowStatus: 1,
    reverseFlow: false,
    ivLevel: 10,
    targetRate: 25,
    recentAlertsCount: 0
  });
  assert(mediumRisk.score === 35 && mediumRisk.level === 'MEDIUM', 'Low level + rate deviation evaluates to 35 (MEDIUM RISK)');

  // Reverse Blood Flow scenario (+50 points) -> High Risk
  const backflowRisk = calculatePrototypeRisk({
    dripRate: 0,
    flowStatus: 0,
    reverseFlow: true,
    ivLevel: 50,
    targetRate: 25,
    recentAlertsCount: 0
  });
  assert(backflowRisk.score >= 50 && backflowRisk.level === 'HIGH', 'Reverse blood flow evaluates to HIGH RISK (>= 50)');
  assert(backflowRisk.factors.includes('Reverse Blood Flow'), 'Risk factors list includes Reverse Blood Flow');

  // TEST 4: Chatbot Domain Restriction & Controlled Refusals
  console.log('\n--- 4. SamvedSync IV Assistant Controlled Refusal Tests ---');

  // Refusal 1: Cancer diagnosis / medical treatment
  const cancerAnswer = await askWatsonX('What are the symptoms and treatment of cancer?');
  assert(
    cancerAnswer.includes('I can provide SamvedSync monitoring information, but I cannot provide medical diagnosis or treatment advice'),
    'Medical diagnosis query triggers controlled medical advice refusal'
  );

  // Refusal 2: Unrelated query (weather)
  const weatherAnswer = await askWatsonX('What is the weather in Mumbai tomorrow?');
  assert(
    weatherAnswer.includes('I can only answer questions related to SamvedSync IV monitoring'),
    'Unrelated query triggers controlled domain restriction refusal'
  );

  // Success 1: IV drop calculation
  const calcAnswer = await askWatsonX('Calculate drop rate for 500 mL over 4 hours with 15 drop factor');
  assert(
    calcAnswer.includes('Target Drip Rate') && calcAnswer.includes('31 drops/min'),
    'Mathematical IV drop calculation provides step-by-step 31 drops/min answer'
  );

  // Success 2: Reverse blood flow explanation
  const reverseAnswer = await askWatsonX('What happens during reverse blood flow?');
  assert(
    reverseAnswer.includes('TCS3200') && reverseAnswer.includes('Reverse Blood Flow'),
    'Reverse blood flow inquiry explains TCS3200 sensor & clinical action protocol'
  );

  // Success 3: Hardware Wi-Fi explanation
  const hwAnswer = await askWatsonX('How does the ESP32 Wi-Fi hardware work?');
  assert(
    hwAnswer.includes('ESP32') && hwAnswer.includes('ThingSpeak') && hwAnswer.includes('3249576'),
    'Hardware telemetry query explains ESP32 -> Wi-Fi -> ThingSpeak channel 3249576'
  );

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('====================================================\n');
}

runTests();
