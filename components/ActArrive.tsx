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

const ORB_COLORS: Record<string, { glow: string; core: string; ring: string }> = {
  calm:      { glow: 'rgba(122,166,255,0.55)', core: 'rgba(180,210,255,0.85)',  ring: 'rgba(200,225,255,0.5)' },
  heavy:     { glow: 'rgba(140,160,195,0.5)',  core: 'rgba(170,185,215,0.75)', ring: 'rgba(195,210,230,0.45)' },
  anxious:   { glow: 'rgba(255,200,80,0.6)',   core: 'rgba(255,230,150,0.85)', ring: 'rgba(255,220,160,0.55)' },
  alive:     { glow: 'rgba(255,140,90,0.65)',  core: 'rgba(255,200,150,0.9)',  ring: 'rgba(255,185,130,0.6)' },
  tender:    { glow: 'rgba(235,175,200,0.6)',  core: 'rgba(245,205,225,0.85)', ring: 'rgba(250,215,230,0.55)' },
  locked_in: { glow: 'rgba(59,111,214,0.55)',  core: 'rgba(120,170,240,0.85)', ring: 'rgba(150,195,255,0.5)' },
  scattered: { glow: 'rgba(160,175,210,0.5)',  core: 'rgba(195,210,235,0.8)',  ring: 'rgba(210,220,240,0.45)' },
  wired:     { glow: 'rgba(255,185,60,0.6)',   core: 'rgba(255,225,130,0.85)', ring: 'rgba(255,215,140,0.55)' },
  sharp:     { glow: 'rgba(255,120,60,0.6)',   core: 'rgba(255,185,120,0.9)',  ring: 'rgba(255,170,100,0.55)' },
  foggy:     { glow: 'rgba(140,155,180,0.45)', core: 'rgba(185,195,215,0.75)', ring: 'rgba(200,210,230,0.4)' },
};

interface Props {
  period: Period;
  onComplete: (mood: MoodValue) => void;
}

export default function ActArrive({ period, onComplete }: Props) {
  const [selected, setSelected] = useState<MoodValue | null>(null);
  const [saving, setSaving] = useState(false);
  const orbs = period === 'night' ? NIGHT_ORBS : DAY_ORBS;

  const greeting   = period === 'night' ? 'Welcome back' : 'Time to focus';
  const question   = period === 'night' ? 'How are you arriving tonight?' : 'What needs your attention first?';
  const ritualTag  = period === 'night' ? 'A quiet pause' : 'A 60-second reset';

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
      {/* Greeting */}
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

      {/* Orbs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        {orbs.map(orb => {
          const colors = ORB_COLORS[orb.value] ?? ORB_COLORS.calm;
          const isSelected = selected === orb.value;
          return (
            <button
              key={orb.value}
              onClick={() => handlePick(orb.value)}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px', borderRadius: 999,
                background: isSelected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? colors.ring : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected ? `0 0 28px ${colors.glow}` : 'none',
                cursor: saving ? 'default' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)',
                transform: isSelected ? 'translateX(4px)' : 'none',
              }}>
              {/* Orb bubble */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: `radial-gradient(circle at 35% 35%, white 0%, ${colors.core} 55%, transparent 100%)`,
                boxShadow: `0 0 16px ${colors.glow}, 0 0 32px ${colors.glow.replace(')', ', 0.3)')
                  .replace('rgba', 'rgba')}`,
                position: 'relative',
              }}>
                {/* Ripple rings */}
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `1px solid ${colors.ring}`,
                  animation: 'orbRipple 6s ease-out infinite',
                }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: `1px solid ${colors.ring}`,
                  animation: 'orbRipple 6s ease-out 2s infinite',
                }} />
              </div>
              {/* Label */}
              <span style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>
                {orb.label}
              </span>
              {/* Hint */}
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
