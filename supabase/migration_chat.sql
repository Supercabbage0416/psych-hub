-- Migration: chat sessions tracking
-- Run in Supabase SQL Editor

-- guided_sessions already exists — add source + summary columns
ALTER TABLE guided_sessions
  ADD COLUMN IF NOT EXISTS source  text DEFAULT 'reflect',
  ADD COLUMN IF NOT EXISTS summary text;

CREATE INDEX IF NOT EXISTS idx_guided_sessions_source ON guided_sessions(source);
