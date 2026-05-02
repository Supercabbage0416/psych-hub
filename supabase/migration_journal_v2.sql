-- Migration: add entry_type, ai_nudge, step tracking to journal_entries
-- Run this in Supabase SQL editor

ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'thought',
  ADD COLUMN IF NOT EXISTS ai_nudge   text,
  ADD COLUMN IF NOT EXISTS step_status text,   -- 'did' | 'did_not' | null
  ADD COLUMN IF NOT EXISTS follow_up  text;

-- Index for fast per-type queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type);
