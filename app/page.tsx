'use client';

import { useEffect, useState } from 'react';
import DailyFindings from '@/components/DailyFindings';
import GrowthMarkers from '@/components/GrowthMarkers';
import ThoughtCapture from '@/components/ThoughtCapture';
import DailyCheckIn from '@/components/DailyCheckIn';
import CheckInSummary from '@/components/CheckInSummary';
import RecoveryNudgeCard from '@/components/RecoveryNudgeCard';
import CozyRoom from '@/components/CozyRoom';
import ReflectionBox from '@/components/ReflectionBox';
import DailyNudgeCard from '@/components/DailyNudgeCard';
import { getTodayCheckIn, createLesson } from '@/lib/supabase';
import type { PartialCheckIn } from '@/lib/checkin';
import { getCategoriesForCheckIn, getCategoryReason } from '@/lib/articleCategories';
import type { CategoryId } from '@/lib/articleCategories';

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
};

function getMoodDisplay(mood: string) {
  return MOOD_DISPLAY[mood] ?? { emoji: '🌙', word: mood };
}

export default function HomePage() {
  const [checkIn, setCheckIn] = useState<PartialCheckIn | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentMood = getMoodDisplay(checkIn?.mood ?? 'okay');

  return (
    <div style={{ position: 'relative', minHeight: '100svh', overflow: 'hidden' }}>
      <CozyRoom />

      <div className="relative z-10 px-5 pt-8 pb-28 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <p className="text-warm-400 text-sm mb-0.5">{formatDate()}</p>
          <h1 className="font-serif text-3xl text-warm-900">Tonight</h1>
          <p className="text-warm-300 text-xs mt-0.5">Pull up a chair. Set the day down.</p>
        </div>

        {/* Check-in */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">How am I today?</p>
          {checkIn ? (
            <CheckInSummary checkIn={checkIn} onEdit={() => setShowCheckIn(true)} />
          ) : (
            <button onClick={() => setShowCheckIn(true)}
              className="w-full bg-white rounded-3xl p-5 shadow-card border border-warm-100 text-left">
              <p className="text-warm-400 text-sm mb-1">You haven't checked in yet</p>
              <p className="text-sage text-sm font-medium">Tap to start daily check-in →</p>
            </button>
          )}
        </section>

        {/* Recovery nudge + AI focus */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">One small thing</p>
          <DailyNudgeCard />
          <RecoveryNudgeCard />
        </section>

        {/* Reflection ritual */}
        <section className="mb-5">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">By the fire</p>
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

        {/* Article feed */}
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

        {/* Journal FAB */}
        <button
          onClick={() => setShowJournal(true)}
          className="fixed right-5 w-14 h-14 bg-sage rounded-full shadow-soft flex items-center justify-center active:scale-95 transition-transform z-40"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
          aria-label="Capture thought"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {showCheckIn && (
          <DailyCheckIn
            onComplete={handleCheckInComplete}
            onClose={() => setShowCheckIn(false)}
            initialValues={checkIn ?? undefined}
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
