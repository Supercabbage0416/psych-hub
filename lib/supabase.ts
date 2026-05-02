import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function logMood(mood: string) {
  const userId = await getUserId();
  return supabase.from('mood_logs').insert({ user_id: userId, mood });
}

export async function getTodayMood(): Promise<string | null> {
  const userId = await getUserId();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('mood_logs')
    .select('mood')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.mood ?? null;
}

export async function getMoodHistory(days = 30) {
  const userId = await getUserId();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from('mood_logs')
    .select('mood, created_at')
    .eq('user_id', userId)
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
  const userId = await getUserId();
  return supabase.from('journal_entries').insert({ user_id: userId, content, tags, prompt, entry_type });
}

export async function getJournalEntries() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function saveReflection(content: string, observation: string) {
  const userId = await getUserId();
  const now = new Date();
  const week = getWeekNumber(now);
  const year = now.getFullYear();
  return supabase.from('weekly_reflections').upsert(
    { user_id: userId, content, observation, week_number: week, year },
    { onConflict: 'user_id,week_number,year' }
  );
}

export async function getThisWeekReflection() {
  const userId = await getUserId();
  const now = new Date();
  const { data } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('week_number', getWeekNumber(now))
    .eq('year', now.getFullYear())
    .limit(1);
  return data?.[0] ?? null;
}

export async function getReflections() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getGrowthStats() {
  const userId = await getUserId();
  const [moods, entries, reflections] = await Promise.all([
    supabase.from('mood_logs').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('journal_entries').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('weekly_reflections').select('id', { count: 'exact' }).eq('user_id', userId),
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
  const userId = await getUserId();
  return supabase.from('user_articles').insert({ user_id: userId, ...article });
}

export async function getUserArticles() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('user_articles').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function deleteUserArticle(id: string) {
  return supabase.from('user_articles').delete().eq('id', id);
}

// ── Guided Sessions ────────────────────────────────────────────────────────

export async function saveGuidedSession(conversation: object[], completed = true) {
  const userId = await getUserId();
  return supabase.from('guided_sessions').insert({ user_id: userId, conversation, completed });
}

export async function getGuidedSessions() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('guided_sessions').select('*').eq('user_id', userId)
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
  const userId = await getUserId();
  return supabase.from('hub_items').insert({ user_id: userId, ...item });
}

export async function getHubItems() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('hub_items').select('*').eq('user_id', userId)
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
  const userId = await getUserId();
  const { data } = await supabase
    .from('reflection_insights')
    .insert({ user_id: userId, ...insight })
    .select()
    .single();
  return data;
}

export async function getLatestInsight() {
  const userId = await getUserId();
  const { data } = await supabase
    .from('reflection_insights')
    .select('*')
    .eq('user_id', userId)
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
  const userId = await getUserId();
  const today = new Date().toISOString().split('T')[0];
  return supabase.from('daily_checkins').upsert(
    { user_id: userId, date: today, ...checkIn },
    { onConflict: 'user_id,date' }
  );
}

// ── Raw thoughts + daily digests ──────────────────────────────────────────

export async function saveRawThought(content: string) {
  const userId = await getUserId();
  return supabase.from('journal_entries').insert({
    user_id: userId, content, tags: [], prompt: '', entry_type: 'raw_thought',
  });
}

export async function getRawThoughtsForDate(date: string) {
  const userId = await getUserId();
  const { data } = await supabase
    .from('journal_entries')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .eq('entry_type', 'raw_thought')
    .gte('created_at', `${date}T00:00:00`)
    .lte('created_at', `${date}T23:59:59`)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function hasDailyDigest(date: string) {
  const userId = await getUserId();
  const { data } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_type', 'daily_digest')
    .eq('prompt', `digest:${date}`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function saveDailyDigest(date: string, digest: object) {
  const userId = await getUserId();
  return supabase.from('journal_entries').insert({
    user_id: userId,
    content: JSON.stringify(digest),
    entry_type: 'daily_digest',
    prompt: `digest:${date}`,
    tags: ['digest'],
  });
}

export async function getDailyDigests(limit = 14) {
  const userId = await getUserId();
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_type', 'daily_digest')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(row => {
    let digest: Record<string, unknown> = {};
    try { digest = JSON.parse(row.content); } catch { /* empty */ }
    return {
      id: row.id as string,
      date: (row.prompt as string).replace('digest:', ''),
      createdAt: row.created_at as string,
      themes: (digest.themes as string[]) ?? [],
      mood_arc: (digest.mood_arc as string) ?? '',
      key_insight: (digest.key_insight as string) ?? '',
      actions: (digest.actions as string[]) ?? [],
      summary: (digest.summary as string) ?? '',
    };
  });
}

// ── Lessons ────────────────────────────────────────────────────────────────

export async function createLesson(input: {
  text: string;
  thoughts?: string | null;
  mood: { emoji: string; word: string };
}) {
  const userId = await getUserId();
  return supabase.from('lessons').insert({
    user_id: userId,
    text: input.text,
    thoughts: input.thoughts ?? null,
    mood_emoji: input.mood.emoji,
    mood_word: input.mood.word,
  });
}

export async function listLessons(filter?: { mood?: string }) {
  const userId = await getUserId();
  let query = supabase
    .from('lessons')
    .select('*')
    .eq('user_id', userId)
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
  const userId = await getUserId();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .limit(1)
    .single();
  return data ?? null;
}
