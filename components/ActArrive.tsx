'use client';

import { useState } from 'react';
import type { Period } from '@/lib/usePeriod';
import type { MoodValue } from '@/lib/checkin';
import { saveCheckIn, logMood } from '@/lib/supabase';

interface OrbConfig { value: MoodValue; label: string; hint: string }

const NIGHT_ORBS: OrbConfig[] = [
  { value: 'calm',    label: 'Calm',    hint: 'settled, at ease' },
  { value: 'heavy',   label: 'Heavy',   hint: 'weighted, slow' },
  { value: 'anxious', label: 'Anxious', hint: 'taut, electric' },
  { value: 'alive',   label: 'Alive',   hint: 'vital, present' },
  { value: 'tender',  label: 'Tender',  hint: 'open-hearted' },
];

const DAY_ORBS: OrbConfig[] = [
  { value: 'locked_in', label: 'Locked in', hint: 'clear, ready' },
  { value: 'scattered', label: 'Scattered',  hint: 'pulled in pieces' },
  { value: 'wired',     label: 'Wired',      hint: 'on edge, tense' },
  { value: 'sharp',     label: 'Sharp',      hint: 'focused, alive' },
  { value: 'foggy',     label: 'Foggy',      hint: 'slow, unclear' },
];

interface Props {
  period: Period;
  onComplete: (mood: MoodValue) => void;
}

export default function ActArrive({ period, onComplete }: Props) {
  const [selected, setSelected] = useState<MoodValue | null>(null);
  const [saving, setSaving] = useState(false);
  const orbs = period === 'night' ? NIGHT_ORBS : DAY_ORBS;

  const greeting  = period === 'night' ? 'Welcome back' : 'Time to focus';
  const question  = period === 'night' ? 'How are you arriving tonight?' : 'What needs your attention first?';
  const ritualTag = period === 'night' ? 'A quiet pause' : 'A 60-second reset';

  async function handlePick(mood: MoodValue) {
    if (saving) return;
    setSelected(mood);
    setSaving(true);
    await Promise.all([
      logMood(mood),
      saveCheckIn({ mood, energy: 3, stress: 3, self_worth: 3, social_safety: 3 }),
    ]).catch(() => {});
    setSaving(false);
    onComplete(mood);
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-grad, var(--bg, #0d1424))',
      padding: '0 24px',
    }}>
      <p style={{ fontFamily: 'var(--font-serif, Georgia)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ember, #ff8c5a)', marginBottom: 16, textAlign: 'center' }}>
        {ritualTag}
      </p>
      <h1 style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 34, fontWeight: 500, color: 'var(--ink, #e8eef9)', textAlign: 'center', lineHeight: 1.2, marginBottom: 4 }}>
        {greeting}
      </h1>
      <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink, #e8eef9)', textAlign: 'center', lineHeight: 1.3, marginBottom: 6 }}>
        {question}
      </p>
      <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3, #6b789a)', textAlign: 'center', marginBottom: 40 }}>
        One word — no need to explain it.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        {orbs.map((orb, i) => {
          const isSelected = selected === orb.value;
          return (
            <button
              key={orb.value}
              onClick={() => handlePick(orb.value)}
              disabled={saving}
              className={`mood-orb mood-orb-${i + 1}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px', borderRadius: 999,
                background: isSelected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? '0 0 28px var(--orb-glow, rgba(180,200,230,0.4))' : 'none',
                cursor: saving ? 'default' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                transform: isSelected ? 'translateX(4px)' : 'none',
              }}>
              {/* Orb — CSS class handles pulse + ripple animations */}
              <div
                className={`mood-orb-bubble ${orb.value}`}
                style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--orb-core)',
                  boxShadow: '0 0 20px var(--orb-glow)',
                }}
              >
                <span className="mood-orb-ripple" />
                <span className="mood-orb-ripple r2" />
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>
                {orb.label}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>
                {orb.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
