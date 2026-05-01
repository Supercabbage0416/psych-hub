'use client';

import { useState } from 'react';
import { saveCheckIn } from '@/lib/supabase';
import { logMood } from '@/lib/supabase';
import type { MoodValue, ScaleValue, PartialCheckIn } from '@/lib/checkin';

const MOODS: { value: MoodValue; label: string; desc: string }[] = [
  { value: 'calm', label: 'Calm', desc: 'Settled, at ease' },
  { value: 'okay', label: 'Okay', desc: 'Neither good nor bad' },
  { value: 'alive', label: 'Alive', desc: 'Energised, present' },
  { value: 'heavy', label: 'Heavy', desc: 'Tired, weighted' },
  { value: 'scattered', label: 'Scattered', desc: 'Overwhelmed, racing' },
  { value: 'numb', label: 'Numb', desc: 'Disconnected, flat' },
];

interface ScaleOption { value: ScaleValue; label: string }

const ENERGY_OPTIONS: ScaleOption[] = [
  { value: 1, label: 'Depleted' },
  { value: 2, label: 'Very low' },
  { value: 3, label: 'Some energy' },
  { value: 4, label: 'Pretty good' },
  { value: 5, label: 'Full energy' },
];

const STRESS_OPTIONS: ScaleOption[] = [
  { value: 1, label: 'Calm' },
  { value: 2, label: 'Mild tension' },
  { value: 3, label: 'Noticeable stress' },
  { value: 4, label: 'High stress' },
  { value: 5, label: 'Overwhelmed' },
];

const SELF_WORTH_OPTIONS: ScaleOption[] = [
  { value: 1, label: 'Very low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Uncertain' },
  { value: 4, label: 'Okay' },
  { value: 5, label: 'Strong' },
];

const SOCIAL_SAFETY_OPTIONS: ScaleOption[] = [
  { value: 1, label: 'Very unsafe' },
  { value: 2, label: 'Guarded' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Mostly safe' },
  { value: 5, label: 'Very safe' },
];

const STEPS = [
  { key: 'mood', title: 'How are you today?', subtitle: 'Pick the word that fits closest.' },
  { key: 'energy', title: 'Energy level?', subtitle: 'How does your body feel right now?' },
  { key: 'stress', title: 'Stress level?', subtitle: 'How much pressure are you carrying?' },
  { key: 'selfWorth', title: 'Self-worth today?', subtitle: 'How worthy or capable do you feel?' },
  { key: 'socialSafety', title: 'Social safety?', subtitle: 'How safe does it feel to be around people?' },
];

interface Props {
  onComplete: (checkIn: PartialCheckIn) => void;
  onClose?: () => void;
}

export default function DailyCheckIn({ onComplete, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PartialCheckIn>({ mood: 'okay' });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleMood(v: MoodValue) {
    setAnswers(prev => ({ ...prev, mood: v }));
  }

  function handleScale(key: string, v: ScaleValue) {
    setAnswers(prev => ({ ...prev, [key]: v }));
  }

  async function handleNext() {
    if (!isLast) {
      setStep(s => s + 1);
      return;
    }
    await handleSave();
  }

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      logMood(answers.mood),
      saveCheckIn({
        mood: answers.mood,
        energy: answers.energy ?? 3,
        stress: answers.stress ?? 3,
        self_worth: answers.selfWorth ?? 3,
        social_safety: answers.socialSafety ?? 3,
      }),
    ]);
    setSaving(false);
    onComplete(answers);
  }

  const canAdvance =
    step === 0 ? !!answers.mood :
    step === 1 ? !!answers.energy :
    step === 2 ? !!answers.stress :
    step === 3 ? !!answers.selfWorth :
    !!answers.socialSafety;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(10,18,32,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="bg-cream rounded-t-4xl px-6 pt-5 pb-10 flex flex-col"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle + close */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex-1" />
          <div className="w-10 h-1 bg-warm-300 rounded-full" />
          <div className="flex-1 flex justify-end">
            {onClose && (
              <button onClick={onClose} className="text-warm-300 p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-sage' : i < step ? 'w-3 bg-sage-light' : 'w-3 bg-warm-200'
            }`} />
          ))}
        </div>

        {/* Question */}
        <p className="font-serif text-2xl text-warm-900 mb-1">{current.title}</p>
        <p className="text-warm-400 text-sm mb-6">{current.subtitle}</p>

        {/* Mood step */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => handleMood(m.value)}
                className={`px-4 py-3.5 rounded-2xl text-left border transition-all ${
                  answers.mood === m.value
                    ? 'bg-white border-sage shadow-card'
                    : 'bg-white border-warm-100 text-warm-600'
                }`}>
                <p className={`text-sm font-medium ${answers.mood === m.value ? 'text-warm-900' : ''}`}>{m.label}</p>
                <p className="text-xs text-warm-400 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Scale steps */}
        {step > 0 && (
          <div className="space-y-2.5 mb-6">
            {[ENERGY_OPTIONS, STRESS_OPTIONS, SELF_WORTH_OPTIONS, SOCIAL_SAFETY_OPTIONS][step - 1].map(opt => {
              const key = ['energy', 'stress', 'selfWorth', 'socialSafety'][step - 1];
              const selected = (answers as Record<string, unknown>)[key] === opt.value;
              return (
                <button key={opt.value} onClick={() => handleScale(key, opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
                    selected ? 'bg-white border-sage shadow-card' : 'bg-white border-warm-100'
                  }`}>
                  <span className={`text-xs font-bold w-5 text-center rounded-full py-0.5 ${
                    selected ? 'bg-sage text-white' : 'bg-warm-100 text-warm-500'
                  }`}>{opt.value}</span>
                  <span className={`text-sm ${selected ? 'text-warm-900 font-medium' : 'text-warm-600'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl bg-white border border-warm-100 text-sm text-warm-500">
              Back
            </button>
          )}
          <button onClick={handleNext} disabled={!canAdvance || saving}
            className="flex-1 py-3 rounded-2xl bg-sage text-white text-sm font-medium disabled:opacity-40 active:scale-95 transition-all">
            {saving ? 'Saving...' : isLast ? 'Done' : 'Next →'}
          </button>
        </div>

        {/* Skip remaining */}
        {step > 0 && (
          <button onClick={handleSave} disabled={saving}
            className="mt-3 text-xs text-warm-300 text-center py-1">
            Skip remaining — just save mood
          </button>
        )}
      </div>
    </div>
  );
}
