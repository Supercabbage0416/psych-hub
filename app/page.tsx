'use client';

import { useEffect, useState } from 'react';
import MoodCapture from '@/components/MoodCapture';
import DailyFindings from '@/components/DailyFindings';
import WeeklyNudge from '@/components/WeeklyNudge';
import GrowthMarkers from '@/components/GrowthMarkers';
import ThoughtCapture from '@/components/ThoughtCapture';
import { getTodayMood } from '@/lib/supabase';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomePage() {
  const [mood, setMood] = useState<string | null>(null);
  const [showMoodCapture, setShowMoodCapture] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getTodayMood().then((m) => {
      setMood(m);
      if (!m) setShowMoodCapture(true);
      setLoaded(true);
    });
  }, []);

  const handleMoodSet = (m: string) => {
    setMood(m);
    setShowMoodCapture(false);
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 animate-fade-in">
      {/* Header */}
      <div className="mb-7">
        <p className="text-warm-400 text-sm mb-0.5">{formatDate()}</p>
        <h1 className="font-serif text-3xl text-warm-900">{getGreeting()}</h1>
        {mood && (
          <button
            onClick={() => setShowMoodCapture(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-warm-500 bg-white px-3 py-1.5 rounded-full shadow-card border border-warm-100 hover:border-sage transition-colors"
          >
            <span className="capitalize">{mood}</span>
            <span className="text-warm-300">·</span>
            <span className="text-xs text-warm-400">tap to update</span>
          </button>
        )}
      </div>

      {/* Today's Nudge */}
      <section className="mb-6">
        <WeeklyNudge mood={mood} />
      </section>

      {/* Today's Findings */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-warm-900">Today's findings</h2>
          <span className="text-xs text-warm-400">3 fields</span>
        </div>
        <DailyFindings />
      </section>

      {/* Growth markers */}
      <section className="mb-6">
        <GrowthMarkers />
      </section>

      {/* Floating capture button */}
      <button
        onClick={() => setShowJournal(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-sage rounded-full shadow-soft flex items-center justify-center active:scale-95 transition-transform z-40"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        aria-label="Capture thought"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Modals */}
      {showMoodCapture && <MoodCapture onComplete={handleMoodSet} />}
      {showJournal && (
        <ThoughtCapture
          onClose={() => setShowJournal(false)}
          onSaved={() => setShowJournal(false)}
        />
      )}
    </div>
  );
}
