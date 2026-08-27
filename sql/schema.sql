-- ================================================
-- SamvedSync — Supabase Schema + Row Level Security
-- ================================================
-- Run this ENTIRE file in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run: drops existing tables first.
-- ================================================

-- Clean slate
drop table if exists messages cascade;
drop table if exists alerts_log cascade;
drop table if exists readings cascade;
drop table if exists doctor_patients cascade;
drop table if exists patients cascade;
drop table if exists doctors cascade;
drop table if exists nurses cascade;
drop table if exists profiles cascade;

-- ================================================
-- 1. PROFILES — one row per Supabase Auth user, holds role
-- ================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text not null unique,
  role        text not null check (role in ('admin','nurse','doctor')),
  created_at  timestamptz default now()
);

-- ================================================
-- 2. NURSES
-- ================================================
create table nurses (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  employee_id text,
  phone       text,
  ward        text,
  shift       text check (shift in ('morning','evening','night')),
  created_at  timestamptz default now()
);

-- ================================================
-- 3. DOCTORS
-- ================================================
create table doctors (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id) on delete cascade,
  employee_id    text,
  phone          text,
  specialization text,
  created_at     timestamptz default now()
);

-- ================================================
-- 4. PATIENTS
-- ================================================
create table patients (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  age                   int,
  gender                text check (gender in ('male','female','other')),
  bed_number            text not null,
  ward                  text,
  diagnosis             text,
  assigned_nurse_id     uuid references nurses(id) on delete set null,
  thingspeak_channel_id text,
  thingspeak_read_key   text,
  drop_factor           int,               -- gtt/mL
  prescribed_rate_ml_hr numeric(6,2),
  is_active             boolean default true,
  admitted_at           timestamptz default now()
);

-- ================================================
-- 5. DOCTOR_PATIENTS — which patients a doctor oversees
-- ================================================
create table doctor_patients (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references doctors(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  assigned_at timestamptz default now(),
  unique (doctor_id, patient_id)
);

-- ================================================
-- 6. READINGS — IV telemetry history (+ AI scoring columns)
-- ================================================
create table readings (
  id            bigint generated always as identity primary key,
  patient_id    uuid not null references patients(id) on delete cascade,
  iv_level      numeric(6,2) default 0,
  drop_count    int default 0,
  drop_rate     numeric(6,2) default 0,
  reverse_flow  boolean default false,
  battery_level numeric(5,2),
  device_status text default 'Unknown',
  risk_score    numeric(5,2),
  risk_label    text,
  ai_explain    text,
  recorded_at   timestamptz default now()
);
create index idx_readings_patient_time on readings (patient_id, recorded_at);

-- ================================================
-- 7. ALERTS_LOG
-- ================================================
create table alerts_log (
  id           bigint generated always as identity primary key,
  patient_id   uuid not null references patients(id) on delete cascade,
  alert_type   text not null check (alert_type in
                 ('iv_low','iv_critically_empty','device_stopped','reverse_flow','drop_anomaly','emergency','ai_anomaly')),
  message      text not null,
  iv_level     numeric(6,2),
  drop_count   int,
  severity     text default 'warning' check (severity in ('info','warning','critical')),
  acknowledged boolean default false,
  created_at   timestamptz default now()
);
create index idx_alerts_patient_time on alerts_log (patient_id, created_at);

-- ================================================
-- 8. MESSAGES — Doctor / Nurse / Admin communication
-- ================================================
create table messages (
  id            bigint generated always as identity primary key,
  sender_id     uuid not null references profiles(id) on delete cascade,
  sender_role   text not null check (sender_role in ('admin','nurse','doctor')),
  receiver_id   uuid,                        -- null = broadcast to receiver_role
  receiver_role text not null check (receiver_role in ('admin','nurse','doctor')),
  patient_id    uuid references patients(id) on delete set null,
  body          text not null,
  is_read       boolean default false,
  created_at    timestamptz default now()
);
create index idx_messages_receiver on messages (receiver_role, receiver_id, created_at);

-- ================================================
-- HELPER FUNCTIONS — used inside RLS policies
-- ================================================
create or replace function public.my_role() returns text
language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_nurse_id() returns uuid
language sql stable security definer as $$
  select id from public.nurses where profile_id = auth.uid();
$$;

create or replace function public.my_doctor_id() returns uuid
language sql stable security definer as $$
  select id from public.doctors where profile_id = auth.uid();
$$;

-- ================================================
-- ENABLE ROW LEVEL SECURITY on every table
-- ================================================
alter table profiles enable row level security;
alter table nurses enable row level security;
alter table doctors enable row level security;
alter table patients enable row level security;
alter table doctor_patients enable row level security;
alter table readings enable row level security;
alter table alerts_log enable row level security;
alter table messages enable row level security;

-- ================================================
-- HIERARCHY (v4):
--   Doctor (top level) — creates Admin + Nurse accounts, sees ALL patients,
--                         adds patients, assigns patients to nurses/doctors
--   Admin               — creates Nurse accounts only, sees ALL patients,
--                         adds patients, assigns patients to nurses/doctors
--   Nurse               — unchanged, only their own assigned patients
-- "admin_or_doctor" below is shorthand used throughout for this shared access.
-- ================================================

-- ================================================
-- POLICIES: profiles
-- ================================================
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or public.my_role() in ('admin','doctor'));

-- ================================================
-- POLICIES: nurses
-- ================================================
create policy "nurses_select" on nurses for select
  using (public.my_role() in ('admin','doctor') or profile_id = auth.uid());
create policy "nurses_write" on nurses for all
  using (public.my_role() in ('admin','doctor'));

-- ================================================
-- POLICIES: doctors
-- ================================================
create policy "doctors_select" on doctors for select
  using (public.my_role() in ('admin','doctor') or profile_id = auth.uid());
create policy "doctors_write" on doctors for all
  using (public.my_role() = 'doctor');

-- ================================================
-- POLICIES: patients (admin + doctor both see/manage ALL patients)
-- ================================================
create policy "patients_admin_doctor_all" on patients for all
  using (public.my_role() in ('admin','doctor'));
create policy "patients_nurse_select" on patients for select
  using (public.my_role() = 'nurse' and assigned_nurse_id = public.my_nurse_id());

-- ================================================
-- POLICIES: doctor_patients
-- ================================================
create policy "doctor_patients_admin_doctor_all" on doctor_patients for all
  using (public.my_role() in ('admin','doctor'));

-- ================================================
-- POLICIES: readings
-- ================================================
create policy "readings_admin_doctor_all" on readings for all
  using (public.my_role() in ('admin','doctor'));
create policy "readings_nurse_select" on readings for select
  using (public.my_role() = 'nurse' and patient_id in (
    select id from patients where assigned_nurse_id = public.my_nurse_id()
  ));

-- ================================================
-- POLICIES: alerts_log (nurse can also acknowledge → update, own patients only)
-- ================================================
create policy "alerts_admin_doctor_all" on alerts_log for all
  using (public.my_role() in ('admin','doctor'));
create policy "alerts_nurse_select" on alerts_log for select
  using (public.my_role() = 'nurse' and patient_id in (
    select id from patients where assigned_nurse_id = public.my_nurse_id()
  ));
create policy "alerts_nurse_update" on alerts_log for update
  using (public.my_role() = 'nurse' and patient_id in (
    select id from patients where assigned_nurse_id = public.my_nurse_id()
  ));

-- ================================================
-- POLICIES: messages
-- ================================================
create policy "messages_insert_own" on messages for insert
  with check (sender_id = auth.uid());
create policy "messages_select_sent" on messages for select
  using (sender_id = auth.uid());
create policy "messages_select_received" on messages for select
  using (receiver_role = public.my_role() and (receiver_id is null or receiver_id = auth.uid()));
create policy "messages_update_read" on messages for update
  using (receiver_role = public.my_role() and (receiver_id is null or receiver_id = auth.uid()));

-- ================================================
-- REALTIME — enable live updates on the tables dashboards watch
-- ================================================
alter publication supabase_realtime add table readings;
alter publication supabase_realtime add table alerts_log;
alter publication supabase_realtime add table messages;

-- ================================================
-- Done. Sanity check:
-- select * from profiles;
-- select tablename from pg_tables where schemaname = 'public';
-- ================================================
