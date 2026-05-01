-- ============================================================
-- PsychHub — Complete Supabase Schema
-- Run this entire file in the Supabase SQL Editor.
-- All tables use device_id (no auth required).
-- RLS is enabled but set wide-open for personal use.
-- ============================================================

-- ── 1. Mood Logs ──────────────────────────────────────────────
create table if not exists mood_logs (
  id         uuid default gen_random_uuid() primary key,
  device_id  text not null,
  mood       text not null,
  created_at timestamptz default now()
);
alter table mood_logs enable row level security;
drop policy if exists "open" on mood_logs;
create policy "open" on mood_logs for all using (true) with check (true);

-- ── 2. Daily Check-Ins (5-dimension) ─────────────────────────
create table if not exists daily_checkins (
  id            uuid default gen_random_uuid() primary key,
  device_id     text not null,
  date          date not null,
  mood          text,
  energy        integer,
  stress        integer,
  self_worth    integer,
  social_safety integer,
  created_at    timestamptz default now(),
  unique (device_id, date)
);
alter table daily_checkins enable row level security;
drop policy if exists "open" on daily_checkins;
create policy "open" on daily_checkins for all using (true) with check (true);

-- ── 3. Journal Entries ────────────────────────────────────────
create table if not exists journal_entries (
  id         uuid default gen_random_uuid() primary key,
  device_id  text not null,
  content    text not null,
  tags       text[] default '{}',
  prompt     text,
  entry_type text,   -- mood_note | social_moment | shame_replay | stress_trigger |
                     -- article_thought | recovery_action | small_win | meaning_note
  created_at timestamptz default now()
);
alter table journal_entries enable row level security;
drop policy if exists "open" on journal_entries;
create policy "open" on journal_entries for all using (true) with check (true);

-- ── 4. Weekly Reflections ─────────────────────────────────────
create table if not exists weekly_reflections (
  id          uuid default gen_random_uuid() primary key,
  device_id   text not null,
  content     text,
  observation text,
  week_number integer not null,
  year        integer not null,
  created_at  timestamptz default now(),
  unique (device_id, week_number, year)
);
alter table weekly_reflections enable row level security;
drop policy if exists "open" on weekly_reflections;
create policy "open" on weekly_reflections for all using (true) with check (true);

-- ── 5. Hub Items ──────────────────────────────────────────────
-- Stores saved articles, findings, and notes.
create table if not exists hub_items (
  id            uuid default gen_random_uuid() primary key,
  device_id     text not null,
  type          text not null,   -- finding | article | note
  title         text not null,
  content       text,
  source        text,
  url           text,
  field         text,            -- category label e.g. "Stress & Recovery"
  tags          text[] default '{}',
  collection    text,            -- explains_me | helps_recover | meaningful | revisit
  save_reason   text,            -- user's optional note on why they saved it
  stage_at_save text,            -- recovery stage at time of save
  mood_at_save  text,            -- mood at time of save
  created_at    timestamptz default now()
);
alter table hub_items enable row level security;
drop policy if exists "open" on hub_items;
create policy "open" on hub_items for all using (true) with check (true);

-- ── 6. User Articles (manually added) ────────────────────────
create table if not exists user_articles (
  id            uuid default gen_random_uuid() primary key,
  device_id     text not null,
  title         text not null,
  content       text,
  source        text,
  url           text,
  category_id   text,
  category_name text,
  summary       text,
  sentiment     text,
  created_at    timestamptz default now()
);
alter table user_articles enable row level security;
drop policy if exists "open" on user_articles;
create policy "open" on user_articles for all using (true) with check (true);

-- ── 7. Guided Sessions ────────────────────────────────────────
create table if not exists guided_sessions (
  id           uuid default gen_random_uuid() primary key,
  device_id    text not null,
  conversation jsonb not null default '[]',
  completed    boolean default false,
  created_at   timestamptz default now()
);
alter table guided_sessions enable row level security;
drop policy if exists "open" on guided_sessions;
create policy "open" on guided_sessions for all using (true) with check (true);

-- ── 8. Reflection Insights (AI weekly reads) ─────────────────
create table if not exists reflection_insights (
  id             uuid default gen_random_uuid() primary key,
  device_id      text not null,
  mood           text,
  motivation     text,
  status         text,
  recommendation text,
  reasoning      text,
  thread         jsonb not null default '[]',
  created_at     timestamptz default now()
);
alter table reflection_insights enable row level security;
drop policy if exists "open" on reflection_insights;
create policy "open" on reflection_insights for all using (true) with check (true);

-- ============================================================
-- Done. 8 tables total.
-- mood_logs, daily_checkins, journal_entries, weekly_reflections,
-- hub_items, user_articles, guided_sessions, reflection_insights
-- ============================================================
