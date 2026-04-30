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

export async function saveJournalEntry(content: string, tags: string[], prompt: string) {
  const deviceId = getDeviceId();
  return supabase.from('journal_entries').insert({ device_id: deviceId, content, tags, prompt });
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
