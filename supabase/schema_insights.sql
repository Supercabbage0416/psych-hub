create table if not exists reflection_insights (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  mood text,
  motivation text,
  status text,
  recommendation text,
  reasoning text,
  thread jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table reflection_insights enable row level security;
create policy "allow all on reflection_insights" on reflection_insights for all using (true) with check (true);
