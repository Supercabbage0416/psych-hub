-- Daily check-in table (mood + 4 wellbeing dimensions)
create table if not exists daily_checkins (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  date date not null,
  mood text,
  energy integer check (energy between 1 and 5),
  stress integer check (stress between 1 and 5),
  self_worth integer check (self_worth between 1 and 5),
  social_safety integer check (social_safety between 1 and 5),
  created_at timestamptz default now(),
  unique (device_id, date)
);

alter table daily_checkins enable row level security;
create policy "allow all on daily_checkins" on daily_checkins for all using (true) with check (true);

-- Add entry_type to journal_entries
alter table journal_entries add column if not exists entry_type text;

-- Add collection metadata to hub_items
alter table hub_items add column if not exists collection text;
alter table hub_items add column if not exists save_reason text;
alter table hub_items add column if not exists stage_at_save text;
alter table hub_items add column if not exists mood_at_save text;
