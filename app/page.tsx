'use client';

import { useEffect, useState } from 'react';
import { usePeriod } from '@/lib/usePeriod';
import { loadSession, saveSession } from '@/lib/session';
import type { MoodValue } from '@/lib/checkin';
import { getCategoriesForCheckIn } from '@/lib/articleCategories';
import ActArrive from '@/components/ActArrive';
import ActReflect from '@/components/ActReflect';
import ActRest from '@/components/ActRest';
import Drawer from '@/components/Drawer';

type Act = 'arrive' | 'reflect' | 'rest';

export default function HomePage() {
  const { period, setPeriodOverride } = usePeriod();
  const [act, setAct] = useState<Act>('arrive');
  const [mood, setMood] = useState<MoodValue>('calm');
  const [lesson, setLesson] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Restore today's session from localStorage
  useEffect(() => {
    const session = loadSession();
    if (session.mood) {
      setMood(session.mood as MoodValue);
      setLesson(session.lesson);
      setAct(session.act);
    }
    setLoaded(true);
  }, []);

  function handleArrive(selectedMood: MoodValue) {
    setMood(selectedMood);
    saveSession({ mood: selectedMood, act: 'reflect' });
    setAct('reflect');
  }

  function handleReflect(savedThoughts: string) {
    setLesson(savedThoughts);
    saveSession({ lesson: savedThoughts, act: 'rest' });
    setAct('rest');
    prefetchArticle(mood);
  }

  function prefetchArticle(currentMood: MoodValue) {
    try {
      const cats = getCategoriesForCheckIn({ mood: currentMood });
      const key = `findings_v11_${cats[0]}`;
      if (!localStorage.getItem(key)) {
        fetch('/api/findings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood: currentMood, categories: cats.slice(0, 2) }),
        }).then(r => r.ok ? r.json() : null).then(data => {
          if (data) localStorage.setItem(key, JSON.stringify(data));
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }

  function handleExit() {
    saveSession({ act: 'rest' });
    setAct('rest');
  }

  function handleReset() {
    saveSession({ mood: null as unknown as string, act: 'arrive', thoughts: '', lesson: '', thoughtsBurned: false });
    setAct('arrive');
    setShowDrawer(false);
  }

  function handleTogglePeriod() {
    setPeriodOverride(period === 'night' ? 'day' : 'night');
  }

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', background: 'var(--bg, #0d1424)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent, #7aa6ff)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <>
      {/* Hamburger — always visible */}
      <button
        onClick={() => setShowDrawer(true)}
        aria-label="Open menu"
        style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 16px)', left: 20,
          zIndex: 30, width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(232,238,249,0.8)" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="16" y2="17" />
        </svg>
      </button>

      {/* Act progress dots */}
      <div style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top) + 24px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, display: 'flex', gap: 7,
      }}>
        {(['arrive', 'reflect', 'rest'] as Act[]).map(a => (
          <div key={a} style={{
            height: 6, borderRadius: 3,
            background: a === act ? 'var(--ember, #ff8c5a)' : act > a ? 'var(--accent, #7aa6ff)' : 'rgba(255,255,255,0.12)',
            transition: 'all 0.4s cubic-bezier(0.2,0.8,0.2,1)',
            width: a === act ? 20 : 6,
          }} />
        ))}
      </div>

      {/* Acts */}
      {act === 'arrive' && (
        <ActArrive period={period} onComplete={handleArrive} />
      )}
      {act === 'reflect' && (
        <ActReflect
          period={period}
          mood={mood}
          initialThoughts={loadSession().thoughts}
          onComplete={handleReflect}
        />
      )}
      {act === 'rest' && (
        <ActRest period={period} mood={mood} lesson={lesson} onExit={handleExit} />
      )}

      {/* Drawer */}
      <Drawer
        open={showDrawer}
        period={period}
        onClose={() => setShowDrawer(false)}
        onTogglePeriod={handleTogglePeriod}
        onReset={handleReset}
      />
    </>
  );
}
