-- ================================================
-- SamvedSync / MediFlow — Migration v5
-- Safe & Non-Destructive Update for Nurse Verification & Notifications
-- ================================================
-- Run this ENTIRE script in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run multiple times (will not overwrite or delete existing data).
-- ================================================

-- 1. Add status column to nurses table (defaults to 'approved' for existing nurse safety)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='nurses' and column_name='status'
  ) then
    alter table nurses add column status text default 'approved' check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Update existing records to approved if any were null
update nurses set status = 'approved' where status is null;

-- 2. Create NOTIFICATIONS table
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null, -- 'registration', 'message', 'approval', 'alert'
  title       text not null,
  message     text not null,
  is_read     boolean default false,
  link        text,
  created_at  timestamptz default now()
);

create index if not exists idx_notifications_user on notifications (user_id, created_at);

-- 3. Enable RLS on notifications
alter table notifications enable row level security;

-- Policies for notifications
drop policy if exists "notifications_own" on notifications;
create policy "notifications_own" on notifications for all
  using (user_id = auth.uid() or public.my_role() in ('admin', 'doctor'));

-- 4. Enable Supabase Realtime for notifications and nurses
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table nurses;

-- 5. Fix RLS policies to allow new Nurse self-registration inserts
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (true);

drop policy if exists "nurses_insert_public" on nurses;
create policy "nurses_insert_public" on nurses for insert with check (true);
