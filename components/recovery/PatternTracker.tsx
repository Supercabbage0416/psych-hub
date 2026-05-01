'use client';

import type { RecoveryState, DailyRecord } from '@/lib/recovery/types';

const COMPLETION_DOT: Record<string, string> = {
  completed: 'bg-sage',
  partial: 'bg-amber-400',
  tried: 'bg-warm-300',
  skipped: 'bg-warm-100',
};
const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed',
  partial: 'Partial',
  tried: 'Tried',
  skipped: 'Skipped',
};
const ENERGY_HEIGHT: Record<string, number> = {
  okay: 100,
  medium: 70,
  low: 40,
  very_low: 15,
};
const ENERGY_COLOR: Record<string, string> = {
  okay: 'bg-sage',
  medium: 'bg-amber-400',
  low: 'bg-rose',
  very_low: 'bg-warm-300',
};

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

interface Props {
  state: RecoveryState;
}

export default function PatternTracker({ state }: Props) {
  const last30 = getLast30Days();
  const recordMap = Object.fromEntries(state.records.map(r => [r.date, r]));

  const last14 = last30.slice(-14);
  const last14Records = last14.map(d => recordMap[d]).filter(Boolean) as DailyRecord[];

  const engaged = last14Records.filter(r => r.completion !== 'skipped').length;
  const completed = last14Records.filter(r => r.completion === 'completed').length;
  const avgEnergy = last14Records.length > 0
    ? last14Records.reduce((s, r) => s + (ENERGY_HEIGHT[r.energy] ?? 40), 0) / last14Records.length
    : 0;

  const energyLabel = avgEnergy > 75 ? 'Okay' : avgEnergy > 50 ? 'Medium' : avgEnergy > 25 ? 'Low' : 'Very low';

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100 text-center">
          <p className="font-serif text-3xl text-warm-900 font-semibold">{engaged}</p>
          <p className="text-xs text-warm-400 mt-1">days engaged<br />(last 14)</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100 text-center">
          <p className="font-serif text-3xl text-warm-900 font-semibold">{completed}</p>
          <p className="text-xs text-warm-400 mt-1">completed<br />(last 14)</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100 text-center">
          <p className="font-serif text-sm text-warm-700 font-semibold mt-1">{energyLabel}</p>
          <p className="text-xs text-warm-400 mt-1">avg energy<br />(last 14)</p>
        </div>
      </div>

      {/* Calendar grid — last 30 days */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Last 30 days</p>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map(date => {
            const record = recordMap[date];
            const dotClass = record ? COMPLETION_DOT[record.completion] : 'bg-warm-100';
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full aspect-square rounded-md ${dotClass} ${isToday ? 'ring-2 ring-warm-400 ring-offset-1' : ''}`}
                  title={`${date}${record ? ' · ' + COMPLETION_LABEL[record.completion] : ''}`}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(COMPLETION_LABEL).map(([k, label]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${COMPLETION_DOT[k]}`} />
              <span className="text-xs text-warm-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Energy trend — last 14 days */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Energy — last 14 days</p>
        <div className="flex items-end gap-1.5 h-16">
          {last14.map(date => {
            const record = recordMap[date];
            const height = record ? ENERGY_HEIGHT[record.energy] ?? 15 : 0;
            const color = record ? ENERGY_COLOR[record.energy] : 'bg-warm-100';
            return (
              <div key={date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t ${color} transition-all`}
                  style={{ height: `${height}%`, minHeight: record ? 4 : 0 }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-warm-300">14 days ago</span>
          <span className="text-xs text-warm-300">Today</span>
        </div>
      </div>

      {/* Shame / social safety (social stage only) */}
      {state.currentStage === 'social' && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Social safety — last 14 days</p>
          <div className="space-y-2">
            {last14.map(date => {
              const record = recordMap[date];
              const shame = record?.reflections?.shame;
              const safety = record?.effectiveness;
              if (!record) return (
                <div key={date} className="flex items-center gap-2">
                  <span className="text-xs text-warm-200 w-16 flex-shrink-0">{date.slice(5)}</span>
                  <div className="flex-1 h-1.5 bg-warm-100 rounded-full" />
                </div>
              );
              const safetyPct = { easy: 90, slightly_easy: 70, neutral: 50, difficult: 25, too_hard: 5 }[safety ?? 'neutral'] ?? 50;
              return (
                <div key={date} className="flex items-center gap-2">
                  <span className="text-xs text-warm-400 w-16 flex-shrink-0">{date.slice(5)}</span>
                  <div className="flex-1 h-1.5 bg-warm-100 rounded-full">
                    <div className="h-1.5 bg-sage rounded-full" style={{ width: `${safetyPct}%` }} />
                  </div>
                  {shame && shame !== 'no' && (
                    <span className="text-xs text-rose flex-shrink-0">
                      {shame === 'strong' ? '●●' : '●'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-warm-300">← Less safe</span>
            <span className="text-xs text-warm-300">More safe →</span>
          </div>
        </div>
      )}

      {/* Reflections list */}
      {last14Records.filter(r => r.reflections && Object.keys(r.reflections).length > 0).length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Recent reflections</p>
          <div className="space-y-4">
            {last14Records
              .filter(r => Object.values(r.reflections).some(v => v && v.length > 3))
              .slice(-5)
              .reverse()
              .map(record => {
                const textEntries = Object.entries(record.reflections).filter(([, v]) => v && v.length > 5);
                if (textEntries.length === 0) return null;
                return (
                  <div key={record.date} className="border-b border-warm-50 last:border-0 pb-3 last:pb-0">
                    <p className="text-xs text-warm-300 mb-1.5">{record.date}</p>
                    {textEntries.slice(0, 2).map(([, val]) => (
                      <p key={val} className="text-xs text-warm-600 leading-relaxed italic">"{val}"</p>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
