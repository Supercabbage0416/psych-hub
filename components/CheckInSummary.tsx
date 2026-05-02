'use client';

import type { PartialCheckIn } from '@/lib/checkin';
import {
  ENERGY_LABELS, STRESS_LABELS, SELF_WORTH_LABELS, SOCIAL_SAFETY_LABELS,
  checkInSummaryLine,
} from '@/lib/checkin';

interface Props {
  checkIn: PartialCheckIn;
  onEdit: () => void;
}

const MOOD_ICONS: Record<string, string> = {
  // original
  calm: '🌿', okay: '☁️', alive: '✨', heavy: '🌧️', scattered: '🌀', numb: '🫥',
  // night orbs
  anxious: '⚡', tender: '🌸',
  // day orbs
  steady: '🌤️', restless: '🔥', energized: '💫', soft: '🫧',
};

function ScaleDot({ value, max = 5, high = false }: { value: number; max?: number; high?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
          i < value
            ? high ? 'bg-rose' : 'bg-sage'
            : 'bg-warm-100'
        }`} />
      ))}
    </div>
  );
}

export default function CheckInSummary({ checkIn, onEdit }: Props) {
  const energy = checkIn.energy ?? 3;
  const stress = checkIn.stress ?? 3;
  const selfWorth = checkIn.selfWorth ?? 3;
  const socialSafety = checkIn.socialSafety ?? 3;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
      {/* Mood + summary */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{MOOD_ICONS[checkIn.mood] ?? '•'}</span>
            <p className="font-medium text-warm-800 capitalize">{checkIn.mood}</p>
          </div>
          <p className="text-xs text-warm-400 leading-snug max-w-[220px]">
            {checkInSummaryLine(checkIn)}
          </p>
        </div>
        <button onClick={onEdit}
          className="text-xs text-warm-400 bg-warm-50 border border-warm-100 px-3 py-1.5 rounded-full">
          Update
        </button>
      </div>

      {/* 4 dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-warm-400 mb-1.5">Energy</p>
          <ScaleDot value={energy} />
          <p className="text-xs text-warm-600 mt-1">{ENERGY_LABELS[energy as 1|2|3|4|5]}</p>
        </div>
        <div>
          <p className="text-xs text-warm-400 mb-1.5">Stress</p>
          <ScaleDot value={stress} high />
          <p className="text-xs text-warm-600 mt-1">{STRESS_LABELS[stress as 1|2|3|4|5]}</p>
        </div>
        <div>
          <p className="text-xs text-warm-400 mb-1.5">Self-worth</p>
          <ScaleDot value={selfWorth} />
          <p className="text-xs text-warm-600 mt-1">{SELF_WORTH_LABELS[selfWorth as 1|2|3|4|5]}</p>
        </div>
        <div>
          <p className="text-xs text-warm-400 mb-1.5">Social safety</p>
          <ScaleDot value={socialSafety} />
          <p className="text-xs text-warm-600 mt-1">{SOCIAL_SAFETY_LABELS[socialSafety as 1|2|3|4|5]}</p>
        </div>
      </div>
    </div>
  );
}
