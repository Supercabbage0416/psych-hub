'use client';

import { useEffect, useState } from 'react';
import DailyFindings from '@/components/DailyFindings';
import GrowthMarkers from '@/components/GrowthMarkers';
import ThoughtCapture from '@/components/ThoughtCapture';
import MoodOrbs from '@/components/MoodOrbs';
import CheckInSummary from '@/components/CheckInSummary';
import RecoveryNudgeCard from '@/components/RecoveryNudgeCard';
import CozyRoom from '@/components/CozyRoom';
import ReflectionBox from '@/components/ReflectionBox';
import DailyNudgeCard from '@/components/DailyNudgeCard';
import Drawer from '@/components/Drawer';
import { getTodayCheckIn, createLesson } from '@/lib/supabase';
import type { PartialCheckIn } from '@/lib/checkin';
import { getCategoriesForCheckIn, getCategoryReason } from '@/lib/articleCategories';
import type { CategoryId } from '@/lib/articleCategories';
import { usePeriod } from '@/lib/usePeriod';

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const MOOD_DISPLAY: Record<string, { emoji: string; word: string }> = {
  calm:      { emoji: '🌿', word: 'calm' },
  heavy:     { emoji: '🌫️', word: 'heavy' },
  anxious:   { emoji: '⚡', word: 'anxious' },
  alive:     { emoji: '✨', word: 'alive' },
  okay:      { emoji: '🌤️', word: 'okay' },
  scattered: { emoji: '💭', word: 'scattered' },
  numb:      { emoji: '🩶', word: 'numb' },
  tender:    { emoji: '🌸', word: 'tender' },
  steady:    { emoji: '🌤️', word: 'steady' },
  restless:  { emoji: '🔥', word: 'restless' },
  energized: { emoji: '💫', word: 'energized' },
  soft:      { emoji: '🫧', word: 'soft' },
};

function getMoodDisplay(mood: string) {
  return MOOD_DISPLAY[mood] ?? { emoji: '🌙', word: mood };
}

export default function HomePage() {
  const { period, setPeriodOverride } = usePeriod();
  const [checkIn, setCheckIn] = useState<PartialCheckIn | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [reasonMap, setReasonMap] = useState<Partial<Record<CategoryId, string>>>({});

  useEffect(() => {
    getTodayCheckIn().then((data) => {
      if (data) {
        const ci: PartialCheckIn = {
          mood: data.mood,
          energy: data.energy,
          stress: data.stress,
          selfWorth: data.self_worth,
          socialSafety: data.social_safety,
        };
        setCheckIn(ci);
        const cats = getCategoriesForCheckIn(ci);
        setCategories(cats);
        const reasons: Partial<Record<CategoryId, string>> = {};
        cats.forEach(id => { reasons[id] = getCategoryReason(id, ci); });
        setReasonMap(reasons);
      } else {
        setShowCheckIn(true);
      }
      setLoaded(true);
    });
  }, []);

  const handleCheckInComplete = (ci: PartialCheckIn) => {
    setCheckIn(ci);
    const cats = getCategoriesForCheckIn(ci);
    setCategories(cats);
    const reasons: Partial<Record<CategoryId, string>> = {};
    cats.forEach(id => { reasons[id] = getCategoryReason(id, ci); });
    setReasonMap(reasons);
    setShowCheckIn(false);
  };

  function handleTogglePeriod() {
    setPeriodOverride(period === 'night' ? 'day' : 'night');
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentMood = getMoodDisplay(checkIn?.mood ?? 'okay');

  // Period-aware copy
  const greeting = period === 'night' ? 'Tonight' : 'Today';
  const tagline = period === 'night'
    ? 'Pull up a chair. Set the day down.'
    : 'What are you carrying into this moment?';

  return (
    <div style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden' }}>
      <CozyRoom />

      <div className="relative z-10 px-5 pt-8 pb-28 animate-fade-in">

        {/* Top bar: menu + date + journal FAB */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowDrawer(true)}
            aria-label="Open menu"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--surface-mid, rgba(149,176,217,0.08))',
              border: '1px solid var(--line, rgba(149,176,217,0.10))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #95B0D9)" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="16" y2="17" />
            </svg>
          </button>

          <div className="text-center flex-1">
            <p className="text-warm-400 text-sm">{formatDate()}</p>
            <h1 className="font-serif text-3xl text-warm-900">{greeting}</h1>
            <p className="text-warm-300 text-xs mt-0.5">{tagline}</p>
          </div>

          {/* placeholder for symmetry */}
          <div style={{ width: 40 }} />
        </div>

        {/* Act 1 — ARRIVE: check-in */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">How am I today?</p>
          {checkIn ? (
            <CheckInSummary checkIn={checkIn} onEdit={() => setShowCheckIn(true)} />
          ) : (
            <button onClick={() => setShowCheckIn(true)}
              className="w-full bg-white rounded-3xl p-5 shadow-card border border-warm-100 text-left">
              <p className="text-warm-400 text-sm mb-1">You haven&apos;t checked in yet</p>
              <p className="text-sage text-sm font-medium">Tap to start →</p>
            </button>
          )}
        </section>

        {/* Recovery nudge + AI focus */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">One small thing</p>
          <DailyNudgeCard />
          <RecoveryNudgeCard />
        </section>

        {/* Act 2 — REFLECT: by the fire */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">
            {period === 'night' ? 'By the fire' : 'Pause + reflect'}
          </p>
          <ReflectionBox
            currentMood={currentMood}
            onBurn={async ({ lesson, mood }) => {
              await createLesson({ text: lesson, mood });
            }}
            onStore={async ({ lesson, thoughts, mood }) => {
              await createLesson({ text: lesson, thoughts, mood });
            }}
          />
        </section>

        {/* Act 3 — REST: article feed */}
        {categories.length > 0 && (
          <section className="mb-5">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs text-warm-400 uppercase tracking-wide">For you tonight</p>
              <span className="text-xs text-warm-300">{categories.length} topics</span>
            </div>
            <DailyFindings categories={categories} reasonMap={reasonMap} />
          </section>
        )}

        {/* Growth markers */}
        <section className="mb-6">
          <GrowthMarkers />
        </section>

        {/* Act indicator dots */}
        <div className="acts-indicator">
          <div className={`dot ${checkIn ? 'done' : 'active'}`} />
          <div className="dot active" />
          <div className="dot" />
        </div>

        {/* Journal FAB */}
        <button
          onClick={() => setShowJournal(true)}
          className="fixed right-5 w-14 h-14 bg-sage rounded-full shadow-soft flex items-center justify-center active:scale-95 transition-transform z-40"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
          aria-label="Capture thought">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Drawer */}
        <Drawer
          open={showDrawer}
          period={period}
          onClose={() => setShowDrawer(false)}
          onTogglePeriod={handleTogglePeriod}
        />

        {showCheckIn && (
          <MoodOrbs
            period={period}
            onComplete={handleCheckInComplete}
            onClose={() => setShowCheckIn(false)}
          />
        )}
        {showJournal && (
          <ThoughtCapture
            quickMode
            onClose={() => setShowJournal(false)}
            onSaved={() => setShowJournal(false)}
          />
        )}
      </div>
    </div>
  );
}
