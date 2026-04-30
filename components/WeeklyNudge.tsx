'use client';

import { getWeeklyNudge } from '@/lib/nudges';

const typeIcons: Record<string, string> = {
  body: '🌿',
  mind: '🧠',
  social: '🤝',
  creative: '✏️',
};

interface Props {
  mood: string | null;
}

export default function WeeklyNudge({ mood }: Props) {
  const nudge = getWeeklyNudge(mood);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{typeIcons[nudge.type] ?? '🌱'}</span>
        <span className="text-xs font-medium text-warm-400 uppercase tracking-wide">This week's nudge</span>
        <span className="ml-auto text-xs text-warm-300 bg-warm-100 px-2 py-0.5 rounded-full">{nudge.duration}</span>
      </div>
      <p className="text-warm-800 text-sm leading-relaxed font-medium">{nudge.text}</p>
    </div>
  );
}
