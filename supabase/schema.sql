-- HNPS Band Attendance — public schema reference
-- Generated from the live database (project dirdanwihxwfuqldruoy, ap-southeast-2)
-- on 2026-07-14. Regenerate after ANY schema or policy change.
--
-- WHY THIS FILE EXISTS
-- The entire security model used to live only in the Supabase dashboard, on a
-- free tier with no point-in-time recovery. Nothing in the repo recorded it, so
-- nothing could review it, diff it, or rebuild it — and the docs an AI assistant
-- reads had already drifted into contradicting it. This file is the record.
--
-- This is a reference dump, not a migration runner: it is hand-maintained from
-- the live DB (the Supabase CLI is not installed on the maintainer's machine).
-- If you change the database, update this file in the same commit.

-- ============================================================================
-- TABLES
-- ============================================================================

create table bands (
  id            serial primary key,
  name          text not null unique,
  short_name    text,
  color         text default '#2b6cb0',
  active        boolean default true,
  practice_day  text,
  practice_time text,
  created_at    timestamptz default now()
);

create table instruments (
  id            serial primary key,
  name          text not null,
  display_order integer not null default 0,
  band_id       integer not null references bands(id),
  unique (name, band_id)
);

create table students (
  id            serial primary key,
  first_name    text not null,
  last_name     text not null,
  instrument_id integer not null references instruments(id),
  grade         text,
  active        boolean not null default true,
  band_id       integer not null references bands(id),
  created_at    timestamptz not null default now()
);

create table sessions (
  id           serial primary key,
  band_id      integer not null references bands(id),
  session_date date not null,
  -- NOT NULL DEFAULT '' is load-bearing: when this was nullable, the offline
  -- retry path inserted NULL, and NULL never conflicts in a unique index — so
  -- sessions_band_date_time_key silently allowed duplicate rehearsals, and every
  -- read path (which filters session_time = '...') could not see the synced row.
  session_time text not null default '',
  session_type text not null check (session_type in ('monday_afternoon','wednesday_morning','morning','afternoon')),
  term         integer,
  year         integer not null default extract(year from now()),
  recorded_by  text,
  created_at   timestamptz not null default now()
);

-- One session per band per date+time. Two volunteers opening the same rehearsal
-- race here; the loser gets 23505 and adopts the winner's row (lib/attendance.js).
create unique index sessions_band_date_time_key on sessions (band_id, session_date, session_time);

create table attendance (
  id          serial primary key,
  session_id  integer not null references sessions(id) on delete cascade,
  student_id  integer not null references students(id),
  present     boolean not null default false,
  recorded_at timestamptz not null default now(),
  -- Makes the whole roll call one idempotent upsert, so the offline retry is
  -- safe to run repeatedly and a failed write cannot report success.
  unique (session_id, student_id)
);

create table band_events (
  id         serial primary key,
  band_id    integer not null references bands(id),
  name       text not null,
  event_type text not null check (event_type in ('concert','competition','eisteddfod','other')),
  event_date date not null,
  event_time text,
  venue      text,
  notes      text,
  created_at timestamptz default now()
);

create table event_attendance (
  id          serial primary key,
  event_id    integer not null references band_events(id) on delete cascade,
  student_id  integer not null references students(id),
  present     boolean default false,
  recorded_at timestamptz default now(),
  unique (event_id, student_id)
);

create table term_dates (
  id         serial primary key,
  year       integer not null,
  term       integer not null check (term between 1 and 4),
  start_date date not null,
  end_date   date not null,
  unique (year, term)
);

-- The access list. Being authenticated is NOT authorisation: a magic link only
-- proves the email; this table decides whether it may see children's data.
create table allowed_users (
  id         serial primary key,
  email      text not null unique,
  name       text,
  role       text not null default 'volunteer' check (role in ('admin','coordinator','volunteer')),
  active     boolean default true,
  created_at timestamptz default now()
);

-- LEGACY: no application code reads this table (grep for 'user_roles' — nothing
-- in app/src). allowed_users is the live access list. It previously had a
-- world-readable policy that leaked volunteer emails to anonymous callers.
-- Kept only to avoid an unreviewed drop; delete once confirmed unused.
create table user_roles (
  id         serial primary key,
  user_email text not null,
  band_id    integer references bands(id),
  role       text not null check (role in ('coordinator','volunteer','viewer')),
  created_at timestamptz default now(),
  unique (user_email, band_id)
);

-- ============================================================================
-- VIEW
-- ============================================================================
-- security_invoker = true is REQUIRED. Without it the view runs as its owner
-- (postgres) and bypasses RLS on the underlying tables, handing any anonymous
-- caller every child's attendance. anon/authenticated hold grants on this view;
-- security_invoker is the only thing making that safe. Verified 2026-07-14:
-- an anon request to /rest/v1/attendance_summary returns [].
-- create view attendance_summary with (security_invoker = true) as ...;

-- ============================================================================
-- AUTHORISATION HELPERS (security definer — they read allowed_users, which the
-- caller itself cannot read in full)
-- ============================================================================

create or replace function public.is_allowed_user()
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from allowed_users
    where lower(email) = lower(auth.jwt()->>'email')
      and active = true
  );
end;
$$;

create or replace function public.is_admin_user()
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from allowed_users
    where lower(email) = lower(auth.jwt()->>'email')
      and role = 'admin'
      and active = true
  );
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Enabled on every table. anon can read NOTHING (verified 2026-07-14 by probing
-- every table with the publishable key: all return []). The keep-alive workflow
-- re-checks this on every run and fails loudly if it ever regresses.
-- ============================================================================

alter table bands            enable row level security;
alter table instruments      enable row level security;
alter table students         enable row level security;
alter table sessions         enable row level security;
alter table attendance       enable row level security;
alter table band_events      enable row level security;
alter table event_attendance enable row level security;
alter table term_dates       enable row level security;
alter table allowed_users    enable row level security;
alter table user_roles       enable row level security;

-- Children's data: read requires membership of the access list, not merely a login.
create policy "Allowed users read students" on students
  for select using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Admins can insert students" on students
  for insert with check (auth.role() = 'authenticated' and is_admin_user());
create policy "Admins can update students" on students
  for update using (auth.role() = 'authenticated' and is_admin_user());

create policy "Allowed users read sessions" on sessions
  for select using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users insert sessions" on sessions
  for insert with check (auth.role() = 'authenticated' and is_allowed_user());
create policy "Admins can delete sessions" on sessions
  for delete using (auth.role() = 'authenticated' and is_admin_user());

create policy "Allowed users read attendance" on attendance
  for select using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users insert attendance" on attendance
  for insert with check (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users update attendance" on attendance
  for update using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Admins can delete attendance" on attendance
  for delete using (auth.role() = 'authenticated' and is_admin_user());

create policy "Allowed users read band_events" on band_events
  for select using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users insert band_events" on band_events
  for insert with check (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users update band_events" on band_events
  for update using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Admins can delete band_events" on band_events
  for delete using (auth.role() = 'authenticated' and is_admin_user());

create policy "Allowed users read event_attendance" on event_attendance
  for select using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users insert event_attendance" on event_attendance
  for insert with check (auth.role() = 'authenticated' and is_allowed_user());
create policy "Allowed users update event_attendance" on event_attendance
  for update using (auth.role() = 'authenticated' and is_allowed_user());
create policy "Admins can delete event_attendance" on event_attendance
  for delete using (auth.role() = 'authenticated' and is_admin_user());

-- Reference data: any signed-in user, but never anon (the anon grant was removed
-- 2026-07-14 — the app only reads these after sign-in).
create policy "Authenticated read bands" on bands
  for select using (auth.role() = 'authenticated');
create policy "Admins can insert bands" on bands
  for insert with check (auth.role() = 'authenticated' and is_admin_user());
create policy "Admins can update bands" on bands
  for update using (auth.role() = 'authenticated' and is_admin_user());

create policy "Authenticated read instruments" on instruments
  for select using (auth.role() = 'authenticated');
create policy "Admins can insert instruments" on instruments
  for insert with check (auth.role() = 'authenticated' and is_admin_user());
create policy "Admins can update instruments" on instruments
  for update using (auth.role() = 'authenticated' and is_admin_user());
create policy "Admins can delete instruments" on instruments
  for delete using (auth.role() = 'authenticated' and is_admin_user());

create policy "Authenticated read term_dates" on term_dates
  for select using (auth.role() = 'authenticated');

-- The access list itself: your own row, or admin. Previously any authenticated
-- user could read every volunteer's email.
create policy "Self or admin read allowed_users" on allowed_users
  for select using (
    auth.role() = 'authenticated'
    and (lower(email) = lower(auth.jwt()->>'email') or is_admin_user())
  );

create policy "Admins read user_roles" on user_roles
  for select using (auth.role() = 'authenticated' and is_admin_user());
