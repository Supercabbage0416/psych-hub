'use client';

export interface DailySession {
  mood: string | null;
  thoughts: string;
  lesson: string;
  thoughtsBurned: boolean;
  act: 'arrive' | 'reflect' | 'rest';
  date: string;
}

function todayKey() {
  return `psychhub.session.${new Date().toISOString().split('T')[0]}`;
}

export function loadSession(): DailySession {
  if (typeof window === 'undefined') return emptySession();
  try {
    const raw = localStorage.getItem(todayKey());
    if (raw) return JSON.parse(raw) as DailySession;
  } catch { /* ignore */ }
  return emptySession();
}

export function saveSession(session: Partial<DailySession>) {
  if (typeof window === 'undefined') return;
  const current = loadSession();
  const updated = { ...current, ...session, date: new Date().toISOString().split('T')[0] };
  localStorage.setItem(todayKey(), JSON.stringify(updated));
  return updated;
}

function emptySession(): DailySession {
  return {
    mood: null, thoughts: '', lesson: '', thoughtsBurned: false,
    act: 'arrive', date: new Date().toISOString().split('T')[0],
  };
}
