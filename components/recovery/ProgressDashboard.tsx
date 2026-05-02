'use client';

import { useState } from 'react';
import type { RecoveryState, DailyRecord } from '@/lib/recovery/types';
import { getStage, getNextStage, STAGE_ORDER, TONE } from '@/lib/recovery/config';
import { checkStageReadiness } from '@/lib/recovery/scoring';
import { advanceStage, saveState, activateLowEnergyMode } from '@/lib/recovery/storage';

const STAGE_ACCENT: Record<string, string> = {
  stabilization: '#7aa6ff',
  competence:    '#7ec8a0',
  autonomy:      '#f0b46a',
  social:        '#e88fa0',
  meaning:       '#b591ff',
};

const ENERGY_HEIGHT: Record<string, number> = { okay: 100, medium: 70, low: 40, very_low: 15 };
const COMPLETION_COLOR: Record<string, string> = { completed: '#7ec8a0', partial: '#f0b46a', tried: '#a8b4cf', skipped: '#3a4a6a' };
const COMPLETION_LABEL: Record<string, string> = { completed: 'Completed', partial: 'Partial', tried: 'Tried', skipped: 'Skipped' };

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });
}

interface Props { state: RecoveryState; onStateChange: (s: RecoveryState) => void }

export default function ProgressDashboard({ state, onStateChange }: Props) {
  const [stageChoice, setStageChoice] = useState<string | null>(null);

  const stage      = getStage(state.currentStage);
  const accent     = STAGE_ACCENT[state.currentStage] ?? '#7aa6ff';
  const stageIdx   = STAGE_ORDER.indexOf(state.currentStage);
  const isLastStage = stageIdx === STAGE_ORDER.length - 1;
  const nextStageId = getNextStage(state.currentStage);
  const nextStage  = nextStageId ? getStage(nextStageId) : null;
  const readiness  = checkStageReadiness(state);

  const last30 = getLast30Days();
  const recordMap = Object.fromEntries(state.records.map(r => [r.date, r]));
  const last14 = last30.slice(-14);
  const last14Records = last14.map(d => recordMap[d]).filter(Boolean) as DailyRecord[];

  const engaged   = last14Records.filter(r => r.completion !== 'skipped').length;
  const completed = last14Records.filter(r => r.completion === 'completed').length;

  function handleAdvance() {
    const next = advanceStage(state);
    saveState(next);
    onStateChange(next);
    setStageChoice('advanced');
  }
  function handleKeep() { setStageChoice('keep'); }
  function handleEasier() {
    const next = activateLowEnergyMode(state);
    onStateChange(next);
    setStageChoice('easier');
  }

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ borderRadius: 20, padding: '18px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', ...extra }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { value: engaged,   label: 'days engaged', sub: 'last 14' },
          { value: completed, label: 'completed',    sub: 'last 14' },
          { value: state.successStreak, label: 'day streak', sub: 'current' },
        ].map(({ value, label, sub }) => (
          <div key={label} style={{ borderRadius: 16, padding: '14px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 26, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>{value}</p>
            <p style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)', marginTop: 2, lineHeight: 1.4 }}>{label}<br />{sub}</p>
          </div>
        ))}
      </div>

      {/* 30-day grid */}
      {card(<>
        <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 12 }}>Last 30 days</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {last30.map(date => {
            const rec = recordMap[date];
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date}
                style={{
                  aspectRatio: '1', borderRadius: 4,
                  background: rec ? COMPLETION_COLOR[rec.completion] : 'rgba(255,255,255,0.06)',
                  outline: isToday ? `2px solid ${accent}` : 'none',
                  outlineOffset: 2,
                }}
                title={`${date}${rec ? ' · ' + COMPLETION_LABEL[rec.completion] : ''}`}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 10 }}>
          {Object.entries(COMPLETION_LABEL).map(([k, label]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COMPLETION_COLOR[k] }} />
              <span style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)' }}>{label}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* Energy bars — last 14 days */}
      {card(<>
        <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10 }}>Energy — last 14 days</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
          {last14.map(date => {
            const rec = recordMap[date];
            const h = rec ? ENERGY_HEIGHT[rec.energy] ?? 15 : 0;
            return (
              <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ width: '100%', borderRadius: '2px 2px 0 0', background: rec ? accent : 'rgba(255,255,255,0.06)', height: `${h}%`, minHeight: rec ? 3 : 0, opacity: rec ? 0.8 : 1, transition: 'height 0.3s' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)' }}>14 days ago</span>
          <span style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)' }}>Today</span>
        </div>
      </>)}

      {/* Stage review */}
      {card(<>
        <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 14 }}>Stage readiness</p>

        {/* Stage progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {STAGE_ORDER.map((id, i) => (
            <div key={id} style={{
              flex: 1, height: 4, borderRadius: 2, transition: 'all 0.4s',
              background: i <= stageIdx ? accent : 'rgba(255,255,255,0.08)',
              opacity: i > stageIdx ? 0.25 : 1,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>{stage.name}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>{readiness.daysInStage}d so far</p>
        </div>

        {/* Readiness metrics */}
        {[
          { label: 'Engagement', pct: Math.round(readiness.engagementRate * 100), min: 60 },
          { label: 'Action score', pct: Math.round((readiness.avgActionScore / 2) * 100), min: 60 },
          { label: 'Effectiveness', pct: Math.round((readiness.avgEffectivenessScore / 2) * 100), min: 50 },
        ].map(({ label, pct, min }) => (
          <div key={label} style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: pct >= min ? '#7ec8a0' : '#f0b46a' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: 4, borderRadius: 2, background: pct >= min ? '#7ec8a0' : '#f0b46a', width: `${pct}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}

        {readiness.daysInStage < stage.minDays && (
          <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginTop: 10 }}>
            Minimum {stage.minDays} days recommended · {Math.max(0, stage.minDays - readiness.daysInStage)} more to go
          </p>
        )}

        {/* Recommendation */}
        <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: readiness.ready ? 'rgba(126,200,160,0.08)' : 'rgba(240,180,106,0.08)', border: `1px solid ${readiness.ready ? 'rgba(126,200,160,0.2)' : 'rgba(240,180,106,0.2)'}` }}>
          <p style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.6 }}>
            {readiness.ready ? TONE.stage_ready : TONE.stage_not_ready}
          </p>
        </div>

        {/* Choice buttons */}
        {!stageChoice ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isLastStage && readiness.ready && nextStage && (
              <button onClick={handleAdvance}
                style={{ width: '100%', padding: '12px 0', borderRadius: 999, fontSize: 14, fontWeight: 500, background: `${accent}18`, border: `1px solid ${accent}40`, color: accent, cursor: 'pointer' }}>
                Move to {nextStage.name} →
              </button>
            )}
            <button onClick={handleKeep}
              style={{ width: '100%', padding: '12px 0', borderRadius: 999, fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-2, #a8b4cf)', cursor: 'pointer' }}>
              Keep current rhythm
            </button>
            <button onClick={handleEasier}
              style={{ width: '100%', padding: '12px 0', borderRadius: 999, fontSize: 13, background: 'transparent', border: '1px solid rgba(122,166,255,0.2)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
              Make nudges gentler
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14, textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', marginBottom: 4 }}>
              {stageChoice === 'advanced' && nextStage ? `Moving to ${nextStage.name}` :
               stageChoice === 'keep' ? 'Keeping current rhythm' :
               'Gentle mode activated'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>
              {stageChoice === 'advanced' ? 'You built something real.' :
               stageChoice === 'keep' ? 'Consistency is how this works.' :
               TONE.low_energy_activated}
            </p>
          </div>
        )}
      </>)}
    </div>
  );
}
