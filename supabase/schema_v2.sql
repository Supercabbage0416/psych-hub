-- Run this in Supabase SQL Editor after schema.sql

-- User-submitted articles
create table if not exists user_articles (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  title text not null,
  content text,
  source text,
  url text,
  category_id text,
  category_name text,
  summary text,
  sentiment text,
  created_at timestamptz default now()
);

-- Guided journal sessions (conversational flow)
create table if not exists guided_sessions (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  conversation jsonb not null default '[]',
  completed boolean default false,
  created_at timestamptz default now()
);

-- My Hub items (saved findings, articles, notes)
create table if not exists hub_items (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  type text not null, -- 'finding', 'article', 'note'
  title text not null,
  content text,
  source text,
  url text,
  field text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

alter table user_articles enable row level security;
alter table guided_sessions enable row level security;
alter table hub_items enable row level security;

create policy "allow all" on user_articles for all using (true);
create policy "allow all" on guided_sessions for all using (true);
create policy "allow all" on hub_items for all using (true);
