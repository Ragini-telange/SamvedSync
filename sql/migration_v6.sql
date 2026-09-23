-- ================================================
-- SamvedSync — Migration v6
-- Safe & Non-Destructive Update for Admin Doctor Management & IoT Ingestion
-- ================================================
-- Safe to re-run multiple times (will not overwrite or delete existing data).
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================

-- 1. Ensure doctors table permits admin write (add/delete doctor)
drop policy if exists "doctors_write" on doctors;
create policy "doctors_write" on doctors for all
  using (public.my_role() in ('admin', 'doctor'));

-- 2. Allow telemetry ingestion into readings table
drop policy if exists "readings_insert_service" on readings;
create policy "readings_insert_service" on readings for insert
  with check (true);

-- 3. Allow system alerts generation into alerts_log
drop policy if exists "alerts_insert_service" on alerts_log;
create policy "alerts_insert_service" on alerts_log for insert
  with check (true);

-- 4. Ensure doctor_patients allows admin and doctor writes
drop policy if exists "doctor_patients_admin_doctor_all" on doctor_patients;
create policy "doctor_patients_admin_doctor_all" on doctor_patients for all
  using (public.my_role() in ('admin', 'doctor'));

-- 5. Enable Realtime on readings and alerts_log if not already added
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'readings'
  ) then
    alter publication supabase_realtime add table readings;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'alerts_log'
  ) then
    alter publication supabase_realtime add table alerts_log;
  end if;
end $$;
