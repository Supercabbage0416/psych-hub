'use client';

import { useState } from 'react';
import type { RecoveryState, DailyRecord, Completion, EnergyLevel } from '@/lib/recovery/types';
import { getStage } from '@/lib/recovery/config';
import { calcActionScore, calcEffectivenessScore, getRandomFeedback, getTodayNudge } from '@/lib/recovery/scoring';
import { addDailyRecord, saveState, getTodayRecord } from '@/lib/recovery/storage';

const STAGE_ACCENT: Record<string, string> = {
  stabilization: '#7aa6ff',
  competence:    '#7ec8a0',
  autonomy:      '#f0b46a',
  social:        '#e88fa0',
  meaning:       '#b591ff',
};

// Activity-focused questions — anchored to the nudge
const QUESTIONS = [
  {
    id: 'completion',
    text: 'How did today\'s nudge go?',
    type: 'options' as const,
    options: [
      { value: 'completed', label: 'Did it' },
      { value: 'partial',   label: 'Partly got there' },
      { value: 'tried',     label: 'Tried, did not land' },
      { value: 'skipped',   label: 'Could not today' },
    ],
  },
  {
    id: 'noticed',
    text: 'What did you notice while doing it?',
    type: 'text' as const,
  },
  {
    id: 'energy',
    text: 'What was your energy like today?',
    type: 'options' as const,
    options: [
      { value: 'okay',     label: 'Okay' },
      { value: 'medium',   label: 'Medium' },
      { value: 'low',      label: 'Low' },
      { value: 'very_low', label: 'Very low' },
    ],
  },
  {
    id: 'carry',
    text: 'One thing to carry forward from today?',
    type: 'text' as const,
  },
];

interface Props {
  state: RecoveryState;
  onStateChange: (s: RecoveryState) => void;
  onClose: () => void;
}

export default function DailyReflection({ state, onStateChange, onClose }: Props) {
  const stage   = getStage(state.currentStage);
  const accent  = STAGE_ACCENT[state.currentStage] ?? '#7aa6ff';
  const nudge   = getTodayNudge(state);
  const existing = getTodayRecord(state);

  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(existing?.reflections ?? {});
  const [done, setDone]       = useState(false);
  const [feedback, setFeedback] = useState('');

  const total   = QUESTIONS.length;
  const current = QUESTIONS[step];
  const answer  = answers[current?.id ?? ''] ?? '';
  const progress = Math.round((step / total) * 100);

  function handleOption(value: string) { setAnswers(prev => ({ ...prev, [current.id]: value })); }
  function handleText(value: string)   { setAnswers(prev => ({ ...prev, [current.id]: value })); }

  function handleNext() {
    if (step < total - 1) setStep(s => s + 1);
    else handleSave();
  }

  function handleSave() {
    const today      = new Date().toISOString().split('T')[0];
    const completion = (answers['completion'] as Completion) || 'skipped';
    const energy     = (answers['energy'] as EnergyLevel) || 'low';
    const msg        = getRandomFeedback(state.currentStage);

    const record: DailyRecord = {
      date: today,
      stageId: state.currentStage,
      nudge,
      lowEnergyMode: state.lowEnergyMode,
      completion,
      energy,
      effectiveness: 'neutral',
      actionScore: calcActionScore(completion),
      effectivenessScore: calcEffectivenessScore('neutral'),
      reflections: answers,
      feedback: msg,
    };

    const next = addDailyRecord(state, record);
    saveState(next);
    onStateChange(next);
    setFeedback(msg);
    setDone(true);
  }

  // Done screen
  if (done) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(10,18,32,0.85)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'var(--bg, #0d1424)', borderRadius: '28px 28px 0 0', padding: '32px 24px 48px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${accent}20`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, fontWeight: 500, color: 'var(--ink, #e8eef9)', marginBottom: 10 }}>Saved</p>
        <p style={{ fontSize: 14, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 280, margin: '0 auto 24px' }}>&ldquo;{feedback}&rdquo;</p>
        <button onClick={onClose}
          style={{ width: '100%', padding: '14px 0', borderRadius: 999, fontSize: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-2, #a8b4cf)', cursor: 'pointer' }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(10,18,32,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg, #0d1424)', borderRadius: '28px 28px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90svh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ paddingTop: 14, paddingBottom: 6, textAlign: 'center' }}>
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, display: 'inline-block' }} />
        </div>

        <div style={{ padding: '8px 24px 48px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)' }}>
              {stage.name} · Reflection
            </p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3, #6b789a)', padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Progress */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 20 }}>
            <div style={{ height: 3, borderRadius: 2, background: accent, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>

          {/* Nudge reminder */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 14px', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 4 }}>Today&apos;s nudge</p>
            <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.5 }}>{nudge}</p>
          </div>

          {/* Question */}
          <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            {step + 1} / {total}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 20, fontWeight: 500, color: 'var(--ink, #e8eef9)', lineHeight: 1.4, marginBottom: 20 }}>
            {current?.text}
          </p>

          {/* Options */}
          {current?.type === 'options' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {current.options?.map(opt => (
                <button key={opt.value} onClick={() => handleOption(opt.value)}
                  style={{
                    textAlign: 'left', padding: '12px 16px', borderRadius: 14, fontSize: 14,
                    background: answer === opt.value ? `${accent}14` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${answer === opt.value ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
                    color: answer === opt.value ? accent : 'var(--ink-2, #a8b4cf)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Text */}
          {current?.type === 'text' && (
            <textarea
              value={answer}
              onChange={e => handleText(e.target.value)}
              placeholder="No filter needed — whatever comes up..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '12px 14px', fontSize: 14, color: 'var(--ink, #e8eef9)',
                fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", lineHeight: 1.6,
                resize: 'none', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = `${accent}40`; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          )}

          {/* Nav */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: '13px 0', borderRadius: 999, fontSize: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
                Back
              </button>
            )}
            <button onClick={handleNext}
              disabled={current?.type === 'options' && !answer}
              style={{
                flex: 1, padding: '13px 0', borderRadius: 999, fontSize: 14, fontWeight: 500,
                background: (current?.type === 'text' || answer) ? `${accent}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${(current?.type === 'text' || answer) ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
                color: (current?.type === 'text' || answer) ? accent : 'var(--ink-3, #6b789a)',
                cursor: (current?.type === 'options' && !answer) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}>
              {step === total - 1 ? 'Save' : 'Next →'}
            </button>
          </div>
          {current?.type === 'text' && (
            <button onClick={handleNext}
              style={{ width: '100%', marginTop: 10, fontSize: 12, color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
