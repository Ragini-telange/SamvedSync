# SamvedSync — Roadmap v3 (Supabase + React Stack)

**This replaces the Node/Express/MySQL backend with Supabase.** ThingSpeak stays
as the IoT data source. IBM Watson Assistant is added at the end for the chatbot.

## Final Stack
| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + Tailwind CSS |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Backend logic | Supabase Edge Functions (Deno) |
| IoT | ESP8266/ESP32 → ThingSpeak → Edge Function polls & writes to Supabase |
| AI Chatbot | IBM Watson Assistant (embedded widget) |
| AI "What-If" | Edge Function with rule-based logic first, ML model later |
| Deployment | Frontend → Vercel; Backend → Supabase Cloud; Chatbot → IBM Cloud |

---

## Phase 1 — Supabase Project + Database
- Create a Supabase project (free tier)
- Build the Postgres schema: `users` (via Supabase Auth), `profiles` (role: admin/nurse/doctor),
  `patients`, `doctor_patients`, `readings`, `alerts_log`, `messages`
- Row Level Security (RLS) policies so nurses only see their assigned patients,
  doctors only see assigned patients, admins see everything
- **This is what we build first, today.**

## Phase 2 — React App Shell + Auth
- Vite + React + Tailwind scaffold
- Supabase Auth integration: login for all 3 roles (email/password, Supabase handles hashing/JWT)
- Role-based routing: redirect to `/admin`, `/doctor`, or `/nurse` after login

## Phase 3 — Admin Dashboard
- Patient CRUD, nurse/doctor CRUD (Supabase Auth admin API for creating staff accounts)
- ThingSpeak Channel ID + Read API Key fields on patient form (same as before)
- Assign nurse / assign doctor to patient
- Reports: CSV/PDF export of patient data

## Phase 4 — ThingSpeak → Supabase Data Pipeline
- Supabase Edge Function (scheduled, e.g. every 10s via cron) fetches latest reading
  from each patient's ThingSpeak channel
- Applies local rule-based checks (IV low, reverse flow, drop-count anomaly)
- Writes to `readings` + `alerts_log` tables
- Supabase Realtime automatically pushes these to subscribed dashboards — no Socket.IO needed

## Phase 5 — Nurse & Doctor Dashboards
- Nurse: assigned patients, live IV level / drop count / reverse-flow status via Supabase Realtime subscription, acknowledge alerts
- Doctor: assigned patients (read-only monitoring), same live data
- Nurse-to-nurse and doctor-to-nurse/admin messaging via a `messages` table + Realtime

## Phase 6 — What-If Simulator (rule-based first)
- Input hypothetical IV level / drop count / reverse-flow → Edge Function scores risk
- Start with rule-based thresholds (same logic as live alerts); AI/ML model swapped in later using your IBM Cloud access if desired

## Phase 7 — IBM Watson Assistant Chatbot
- Embed the Watson Assistant web-chat widget in all 3 dashboards
- Connects to your existing IBM Cloud access

## Phase 8 — Deployment
- Frontend → Vercel (connect GitHub repo, auto-deploy)
- Backend → already live on Supabase Cloud (nothing to deploy)
- Chatbot → IBM Cloud (already hosted)

---
### What carries over from before
- Your hardware plan (dual ESP32, ESP-NOW, TCS34725, laser/LDR) — unchanged
- Your 3-role workflow (Admin assigns → Nurse monitors → Doctor oversees) — unchanged
- The drop-factor/prescribed-rate clinical config idea — unchanged, just moves to Postgres

### What we're leaving behind
- The Node/Express/MySQL server and Socket.IO layer we built (Supabase replaces all of it)
- Local MySQL/Mosquitto setup entirely — no more local database or broker to manage

---
**Next: Phase 1.** Create your free Supabase project at supabase.com, then I'll give you
the exact SQL schema + RLS policies to paste into the Supabase SQL editor.
