-- Mood logs: daily emotional check-in
create table if not exists mood_logs (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  mood text not null,
  created_at timestamptz default now()
);

-- Journal entries: thought captures with prompts
create table if not exists journal_entries (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  content text not null,
  tags text[] default '{}',
  prompt text,
  created_at timestamptz default now()
);

-- Weekly reflections
create table if not exists weekly_reflections (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  content text not null,
  observation text,
  week_number int not null,
  year int not null,
  created_at timestamptz default now(),
  unique(device_id, week_number, year)
);

-- Saved findings: articles the user bookmarked
create table if not exists saved_findings (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  title text not null,
  source text,
  field text,
  one_word text,
  url text,
  created_at timestamptz default now()
);

-- Row Level Security (optional, good practice)
alter table mood_logs enable row level security;
alter table journal_entries enable row level security;
alter table weekly_reflections enable row level security;
alter table saved_findings enable row level security;

-- Permissive policies for device_id-based access (no auth required)
create policy "allow all by device" on mood_logs for all using (true);
create policy "allow all by device" on journal_entries for all using (true);
create policy "allow all by device" on weekly_reflections for all using (true);
create policy "allow all by device" on saved_findings for all using (true);
