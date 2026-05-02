'use client';

import { useState } from 'react';
import { saveCheckIn, logMood } from '@/lib/supabase';
import type { MoodValue, PartialCheckIn } from '@/lib/checkin';
import type { Period } from '@/lib/usePeriod';

interface OrbConfig {
  value: MoodValue;
  label: string;
  hint: string;
  cssClass: string;
}

const NIGHT_ORBS: OrbConfig[] = [
  { value: 'calm',    label: 'Calm',    hint: 'settled, at ease',      cssClass: 'calm' },
  { value: 'heavy',   label: 'Heavy',   hint: 'weighted, slow',        cssClass: 'heavy' },
  { value: 'anxious', label: 'Anxious', hint: 'taut, electric',        cssClass: 'anxious' },
  { value: 'alive',   label: 'Alive',   hint: 'vital, awake',          cssClass: 'alive' },
  { value: 'tender',  label: 'Tender',  hint: 'open-hearted',          cssClass: 'tender' },
];

const DAY_ORBS: OrbConfig[] = [
  { value: 'steady',    label: 'Steady',    hint: 'grounded, clear',     cssClass: 'steady' },
  { value: 'scattered', label: 'Scattered', hint: 'pulled in pieces',    cssClass: 'scattered' },
  { value: 'restless',  label: 'Restless',  hint: 'on edge, unsettled',  cssClass: 'restless' },
  { value: 'energized', label: 'Energized', hint: 'ready to move',       cssClass: 'energized' },
  { value: 'soft',      label: 'Soft',      hint: 'gentle, quiet',       cssClass: 'soft' },
];

interface Props {
  period: Period;
  onComplete: (checkIn: PartialCheckIn) => void;
  onClose?: () => void;
}

export default function MoodOrbs({ period, onComplete, onClose }: Props) {
  const [selected, setSelected] = useState<MoodValue | null>(null);
  const [saving, setSaving] = useState(false);
  const orbs = period === 'night' ? NIGHT_ORBS : DAY_ORBS;

  const greeting = period === 'night' ? 'Welcome back' : 'Good to see you';
  const question = period === 'night'
    ? 'How are you arriving tonight?'
    : 'What needs your attention first?';
  const subtext = period === 'night'
    ? 'One word — no need to explain it.'
    : 'Pick the word that fits closest.';

  async function handleSelect(mood: MoodValue) {
    setSelected(mood);
    setSaving(true);
    await Promise.all([
      logMood(mood),
      saveCheckIn({ mood, energy: 3, stress: 3, self_worth: 3, social_safety: 3 }),
    ]);
    setSaving(false);
    onComplete({ mood });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(7,16,31,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div
        className="w-full rounded-t-[2rem] px-6 pt-6 pb-10"
        style={{
          background: 'var(--bg, #0F1828)',
          border: '1px solid var(--line, rgba(149,176,217,0.10))',
          borderBottom: 'none',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line-strong, rgba(149,176,217,0.18))', margin: '0 auto 20px' }} />

        {/* Header */}
        <p style={{ fontFamily: 'var(--font-serif, Georgia)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm, #E89B6C)', textAlign: 'center', marginBottom: 12 }}>
          {greeting}
        </p>
        <p style={{ fontFamily: 'var(--font-serif, Georgia)', fontSize: 24, fontWeight: 500, color: 'var(--text, #E6E1D7)', textAlign: 'center', lineHeight: 1.25, marginBottom: 4 }}>
          {question}
        </p>
        <p style={{ fontFamily: 'var(--font-serif, Georgia)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted, #8A8276)', textAlign: 'center', marginBottom: 28 }}>
          {subtext}
        </p>

        {/* Orbs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orbs.map(orb => (
            <button
              key={orb.value}
              onClick={() => !saving && handleSelect(orb.value)}
              disabled={saving}
              className={`mood-orb ${selected === orb.value ? 'selected' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 999,
                background: selected === orb.value ? 'var(--surface-mid, rgba(149,176,217,0.08))' : 'var(--surface-soft, rgba(149,176,217,0.04))',
                border: `1px solid ${selected === orb.value ? 'var(--accent, #95B0D9)' : 'var(--line, rgba(149,176,217,0.10))'}`,
                boxShadow: selected === orb.value ? '0 0 24px var(--accent-glow, rgba(149,176,217,0.20))' : 'none',
                cursor: saving ? 'default' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4,0.1,0.2,1)',
                width: '100%',
              }}>
              {/* Orb bubble */}
              <div className={`mood-orb-bubble ${orb.cssClass}`} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, position: 'relative' }}>
                <div className="mood-orb-ripple" />
                <div className="mood-orb-ripple r2" />
                <div className="mood-orb-ripple r3" />
              </div>
              {/* Label */}
              <span style={{ fontFamily: 'var(--font-serif, Georgia)', fontSize: 17, fontWeight: 500, color: 'var(--text, #E6E1D7)' }}>
                {orb.label}
              </span>
              {/* Hint */}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif, Georgia)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-dim, #5C5750)' }}>
                {orb.hint}
              </span>
            </button>
          ))}
        </div>

        {onClose && (
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, fontStyle: 'italic', color: 'var(--text-dim, #5C5750)', fontFamily: 'var(--font-serif, Georgia)', cursor: 'pointer' }}
            onClick={onClose}>
            skip for now
          </p>
        )}
      </div>
    </div>
  );
}
