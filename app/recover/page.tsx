'use client';

import { useEffect, useState } from 'react';
import type { RecoveryState } from '@/lib/recovery/types';
import { loadState, saveState } from '@/lib/recovery/storage';
import RecoveryHome from '@/components/recovery/RecoveryHome';
import DailyReflection from '@/components/recovery/DailyReflection';
import ProgressDashboard from '@/components/recovery/ProgressDashboard';

type Tab = 'today' | 'progress';

export default function RecoverPage() {
  const [state, setState] = useState<RecoveryState | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [showReflection, setShowReflection] = useState(false);

  useEffect(() => { setState(loadState()); }, []);

  const handleStateChange = (next: RecoveryState) => {
    setState(next);
    saveState(next);
  };

  if (!state) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', background: 'var(--bg, #0d1424)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--accent, #7aa6ff)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg, #0d1424)', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 4 }}>
          Where you are tonight
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 30, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>
          Mend
        </h1>
      </div>

      {/* 2-tab bar */}
      <div style={{ display: 'flex', gap: 4, margin: '0 20px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([
          { id: 'today' as Tab, label: 'Today' },
          { id: 'progress' as Tab, label: 'Progress' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? 'rgba(122,166,255,0.12)' : 'transparent',
              color: tab === t.id ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {tab === 'today' && (
          <RecoveryHome
            state={state}
            onStateChange={handleStateChange}
            onStartReflection={() => setShowReflection(true)}
          />
        )}
        {tab === 'progress' && <ProgressDashboard state={state} onStateChange={handleStateChange} />}
      </div>

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
