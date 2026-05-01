'use client';

import { useEffect, useState } from 'react';
import type { RecoveryState } from '@/lib/recovery/types';
import { loadState, saveState } from '@/lib/recovery/storage';
import RecoveryHome from '@/components/recovery/RecoveryHome';
import DailyReflection from '@/components/recovery/DailyReflection';
import PatternTracker from '@/components/recovery/PatternTracker';
import WeeklyReview from '@/components/recovery/WeeklyReview';
import StageReview from '@/components/recovery/StageReview';
import AIInsights from '@/components/recovery/AIInsights';

type Tab = 'today' | 'progress' | 'weekly' | 'stage' | 'insights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'today',    label: 'Today' },
  { id: 'progress', label: 'Progress' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'stage',    label: 'Stage' },
  { id: 'insights', label: 'AI' },
];

export default function RecoverPage() {
  const [state, setState] = useState<RecoveryState | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => {
    setState(loadState());
  }, []);

  const handleStateChange = (next: RecoveryState) => {
    setState(next);
    saveState(next);
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 animate-fade-in pb-4">
      {/* Header */}
      <div className="mb-5">
        <p className="text-warm-400 text-xs uppercase tracking-wide mb-0.5">Where you are tonight</p>
        <h1 className="font-serif text-3xl text-warm-900">Mend</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-warm-100 rounded-2xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-warm-900 shadow-sm'
                : 'text-warm-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'today' && (
        <RecoveryHome
          state={state}
          onStateChange={handleStateChange}
          onStartReflection={() => setShowReflection(true)}
        />
      )}
      {tab === 'progress' && <PatternTracker state={state} />}
      {tab === 'weekly'   && <WeeklyReview state={state} />}
      {tab === 'stage'    && <StageReview state={state} onStateChange={handleStateChange} />}
      {tab === 'insights' && <AIInsights state={state} />}

      {/* Daily reflection modal */}
      {showReflection && (
        <DailyReflection
          state={state}
          onStateChange={handleStateChange}
          onClose={() => setShowReflection(false)}
        />
      )}
    </div>
  );
}
