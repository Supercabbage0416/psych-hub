-- ============================================================
-- Psych Hub — Add user_id auth migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- This migrates all tables from device_id (anonymous) to
-- user_id (auth.users) so every user has their own account.
-- ============================================================

-- 1. Add user_id column to every table
-- (nullable first so existing rows don't break)

ALTER TABLE mood_logs         ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE journal_entries   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE weekly_reflections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_articles      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE guided_sessions    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE hub_items          ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE reflection_insights ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_checkins     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lessons            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create indexes for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id          ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id    ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_articles_user_id      ON user_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_items_user_id          ON hub_items(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id     ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_user_id            ON lessons(user_id);

-- 3. Fix unique constraint on weekly_reflections
--    (was device_id,week_number,year — now user_id,week_number,year)
ALTER TABLE weekly_reflections
  DROP CONSTRAINT IF EXISTS weekly_reflections_device_id_week_number_year_key;
ALTER TABLE weekly_reflections
  ADD CONSTRAINT weekly_reflections_user_id_week_number_year_key
  UNIQUE (user_id, week_number, year);

-- 4. Fix unique constraint on daily_checkins
ALTER TABLE daily_checkins
  DROP CONSTRAINT IF EXISTS daily_checkins_device_id_date_key;
ALTER TABLE daily_checkins
  ADD CONSTRAINT daily_checkins_user_id_date_key
  UNIQUE (user_id, date);

-- 5. Enable Row Level Security on all tables
ALTER TABLE mood_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE guided_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons             ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies — each user sees only their own rows
-- Drop old device_id-based policies first (if they exist), then create new ones

-- mood_logs
DROP POLICY IF EXISTS "Users can manage own mood_logs" ON mood_logs;
CREATE POLICY "Users can manage own mood_logs" ON mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- journal_entries
DROP POLICY IF EXISTS "Users can manage own journal_entries" ON journal_entries;
CREATE POLICY "Users can manage own journal_entries" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- weekly_reflections
DROP POLICY IF EXISTS "Users can manage own weekly_reflections" ON weekly_reflections;
CREATE POLICY "Users can manage own weekly_reflections" ON weekly_reflections
  FOR ALL USING (auth.uid() = user_id);

-- user_articles
DROP POLICY IF EXISTS "Users can manage own user_articles" ON user_articles;
CREATE POLICY "Users can manage own user_articles" ON user_articles
  FOR ALL USING (auth.uid() = user_id);

-- guided_sessions
DROP POLICY IF EXISTS "Users can manage own guided_sessions" ON guided_sessions;
CREATE POLICY "Users can manage own guided_sessions" ON guided_sessions
  FOR ALL USING (auth.uid() = user_id);

-- hub_items
DROP POLICY IF EXISTS "Users can manage own hub_items" ON hub_items;
CREATE POLICY "Users can manage own hub_items" ON hub_items
  FOR ALL USING (auth.uid() = user_id);

-- reflection_insights
DROP POLICY IF EXISTS "Users can manage own reflection_insights" ON reflection_insights;
CREATE POLICY "Users can manage own reflection_insights" ON reflection_insights
  FOR ALL USING (auth.uid() = user_id);

-- daily_checkins
DROP POLICY IF EXISTS "Users can manage own daily_checkins" ON daily_checkins;
CREATE POLICY "Users can manage own daily_checkins" ON daily_checkins
  FOR ALL USING (auth.uid() = user_id);

-- lessons
DROP POLICY IF EXISTS "Users can manage own lessons" ON lessons;
CREATE POLICY "Users can manage own lessons" ON lessons
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- DONE. Old device_id columns are left in place so no data
-- is lost. You can drop them later once you've confirmed
-- everything is working:
--   ALTER TABLE mood_logs DROP COLUMN device_id;
--   (repeat for each table)
-- ============================================================
