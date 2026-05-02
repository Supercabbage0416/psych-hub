-- Migration v2: fix device_id constraints + new columns
-- Run this in Supabase SQL editor (Dashboard → SQL Editor)

-- ── journal_entries ──────────────────────────────────────────────────────────
-- Make device_id nullable so new auth-based inserts work without it
ALTER TABLE journal_entries ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE journal_entries ALTER COLUMN device_id SET DEFAULT '';

-- Add entry type, AI nudge and step tracking
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS entry_type  text DEFAULT 'thought',
  ADD COLUMN IF NOT EXISTS ai_nudge    text,
  ADD COLUMN IF NOT EXISTS step_status text,
  ADD COLUMN IF NOT EXISTS follow_up   text;

CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type);

-- ── user_articles ─────────────────────────────────────────────────────────────
-- Make device_id nullable so new auth-based inserts work without it
ALTER TABLE user_articles ALTER COLUMN device_id DROP NOT NULL;
ALTER TABLE user_articles ALTER COLUMN device_id SET DEFAULT '';

-- Add tags array for AI-suggested, user-chosen labels
ALTER TABLE user_articles
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
