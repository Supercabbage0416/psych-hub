-- Recovery records: one row per day per device
create table if not exists recovery_records (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  date date not null,
  stage_id text not null,
  nudge text,
  low_energy_mode boolean default false,
  completion text,
  energy text,
  effectiveness text,
  action_score numeric default 0,
  effectiveness_score numeric default 0,
  reflections jsonb default '{}'::jsonb,
  feedback text,
  created_at timestamptz default now(),
  unique(device_id, date)
);

-- Recovery state: current stage + streaks per device
create table if not exists recovery_state (
  device_id text primary key,
  current_stage text not null default 'stabilization',
  stage_start_date date not null default current_date,
  low_energy_mode boolean default false,
  low_energy_streak int default 0,
  success_streak int default 0,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table recovery_records enable row level security;
alter table recovery_state enable row level security;

-- Policies: device_id acts as the identity (anonymous, personal use)
create policy "allow all on recovery_records" on recovery_records for all using (true) with check (true);
create policy "allow all on recovery_state" on recovery_state for all using (true) with check (true);
