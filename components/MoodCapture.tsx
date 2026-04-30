'use client';

import { useState } from 'react';
import { logMood } from '@/lib/supabase';

const moods = [
  { word: 'calm', color: 'bg-sage-pale text-sage border-sage-light', emoji: '🌿' },
  { word: 'okay', color: 'bg-warm-100 text-warm-700 border-warm-300', emoji: '☁️' },
  { word: 'alive', color: 'bg-amber-50 text-amber-700 border-amber-200', emoji: '✨' },
  { word: 'heavy', color: 'bg-blue-50 text-blue-600 border-blue-200', emoji: '🌫️' },
  { word: 'scattered', color: 'bg-orange-50 text-orange-600 border-orange-200', emoji: '🍂' },
  { word: 'numb', color: 'bg-gray-50 text-gray-500 border-gray-200', emoji: '🪨' },
];

interface Props {
  onComplete: (mood: string) => void;
}

export default function MoodCapture({ onComplete }: Props) {
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelect = async (mood: string) => {
    setSelecting(mood);
    await logMood(mood);
    setTimeout(() => onComplete(mood), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(61,53,48,0.3)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-cream rounded-t-4xl px-6 pt-8 pb-safe-8 animate-slide-up"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>

        <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-6" />

        <p className="font-serif text-2xl text-warm-900 mb-1">How are you arriving today?</p>
        <p className="text-warm-500 text-sm mb-7">No right answer. Just honest.</p>

        <div className="grid grid-cols-3 gap-3">
          {moods.map((m) => (
            <button
              key={m.word}
              onClick={() => handleSelect(m.word)}
              className={`
                flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border
                transition-all duration-200 active:scale-95
                ${m.color}
                ${selecting === m.word ? 'scale-95 opacity-70' : ''}
              `}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-sm font-medium capitalize">{m.word}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
