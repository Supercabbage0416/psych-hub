import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('psych_hub_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('psych_hub_device_id', id);
  }
  return id;
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function logMood(mood: string) {
  const deviceId = getDeviceId();
  return supabase.from('mood_logs').insert({ device_id: deviceId, mood });
}

export async function getTodayMood(): Promise<string | null> {
  const deviceId = getDeviceId();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('mood_logs')
    .select('mood')
    .eq('device_id', deviceId)
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.mood ?? null;
}

export async function getMoodHistory(days = 30) {
  const deviceId = getDeviceId();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from('mood_logs')
    .select('mood, created_at')
    .eq('device_id', deviceId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function saveJournalEntry(
  content: string,
  tags: string[],
  prompt: string,
  entry_type?: string,
) {
  const deviceId = getDeviceId();
  return supabase.from('journal_entries').insert({ device_id: deviceId, content, tags, prompt, entry_type });
}

export async function getJournalEntries() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function saveReflection(content: string, observation: string) {
  const deviceId = getDeviceId();
  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();
  return supabase.from('weekly_reflections').upsert(
    { device_id: deviceId, content, observation, week_number: week, year },
    { onConflict: 'device_id,week_number,year' }
  );
}

export async function getThisWeekReflection() {
  const deviceId = getDeviceId();
  const now = new Date();
  const { data } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('device_id', deviceId)
    .eq('week_number', getWeekNumber(now))
    .eq('year', now.getFullYear())
    .limit(1);
  return data?.[0] ?? null;
}

export async function getReflections() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getGrowthStats() {
  const deviceId = getDeviceId();
  const [moods, entries, reflections] = await Promise.all([
    supabase.from('mood_logs').select('id', { count: 'exact' }).eq('device_id', deviceId),
    supabase.from('journal_entries').select('id', { count: 'exact' }).eq('device_id', deviceId),
    supabase.from('weekly_reflections').select('id', { count: 'exact' }).eq('device_id', deviceId),
  ]);
  return {
    daysLogged: moods.count ?? 0,
    thoughtsCaptured: entries.count ?? 0,
    reflectionsDone: reflections.count ?? 0,
  };
}

// ── User Articles ──────────────────────────────────────────────────────────

export async function saveUserArticle(article: {
  title: string; content?: string; source?: string; url?: string;
  category_id?: string; category_name?: string; summary?: string; sentiment?: string;
}) {
  const deviceId = getDeviceId();
  return supabase.from('user_articles').insert({ device_id: deviceId, ...article });
}

export async function getUserArticles() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('user_articles').select('*').eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function deleteUserArticle(id: string) {
  return supabase.from('user_articles').delete().eq('id', id);
}

// ── Guided Sessions ────────────────────────────────────────────────────────

export async function saveGuidedSession(conversation: object[], completed = true) {
  const deviceId = getDeviceId();
  return supabase.from('guided_sessions').insert({ device_id: deviceId, conversation, completed });
}

export async function getGuidedSessions() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('guided_sessions').select('*').eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// ── My Hub ─────────────────────────────────────────────────────────────────

export async function saveHubItem(item: {
  type: 'finding' | 'article' | 'note';
  title: string; content?: string; source?: string; url?: string;
  field?: string; tags?: string[];
  collection?: 'explains_me' | 'helps_recover' | 'meaningful' | 'revisit';
  save_reason?: string;
  stage_at_save?: string;
  mood_at_save?: string;
}) {
  const deviceId = getDeviceId();
  return supabase.from('hub_items').insert({ device_id: deviceId, ...item });
}

export async function getHubItems() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('hub_items').select('*').eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function deleteHubItem(id: string) {
  return supabase.from('hub_items').delete().eq('id', id);
}

export async function saveReflectionInsight(insight: {
  mood: string; motivation: string; status: string;
  recommendation: string; reasoning: string;
  thread: { role: string; content: string }[];
}) {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('reflection_insights')
    .insert({ device_id: deviceId, ...insight })
    .select()
    .single();
  return data;
}

export async function getLatestInsight() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('reflection_insights')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

// ── Daily Check-In ─────────────────────────────────────────────────────────

export async function saveCheckIn(checkIn: {
  mood: string;
  energy: number;
  stress: number;
  self_worth: number;
  social_safety: number;
}) {
  const deviceId = getDeviceId();
  const today = new Date().toISOString().split('T')[0];
  return supabase.from('daily_checkins').upsert(
    { device_id: deviceId, date: today, ...checkIn },
    { onConflict: 'device_id,date' }
  );
}

// ── Lessons ────────────────────────────────────────────────────────────────

export async function createLesson(input: {
  text: string;
  thoughts?: string | null;
  mood: { emoji: string; word: string };
}) {
  const deviceId = getDeviceId();
  return supabase.from('lessons').insert({
    device_id: deviceId,
    text: input.text,
    thoughts: input.thoughts ?? null,
    mood_emoji: input.mood.emoji,
    mood_word: input.mood.word,
  });
}

export async function listLessons(filter?: { mood?: string }) {
  const deviceId = getDeviceId();
  let query = supabase
    .from('lessons')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });
  if (filter?.mood) query = query.eq('mood_word', filter.mood);
  const { data } = await query;
  return (data ?? []).map((row: {
    id: string; text: string; thoughts: string | null;
    created_at: string; mood_emoji: string; mood_word: string;
  }) => ({
    id: row.id,
    text: row.text,
    thoughts: row.thoughts,
    createdAt: row.created_at,
    mood: { emoji: row.mood_emoji, word: row.mood_word },
  }));
}

export async function getTodayCheckIn() {
  const deviceId = getDeviceId();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('device_id', deviceId)
    .eq('date', today)
    .limit(1)
    .single();
  return data ?? null;
}
