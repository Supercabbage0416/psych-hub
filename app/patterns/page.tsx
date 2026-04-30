'use client';

import { useEffect, useState } from 'react';
import { getMoodHistory, getJournalEntries, getGrowthStats } from '@/lib/supabase';

const moodColors: Record<string, string> = {
  calm: '#7A9A6E',
  okay: '#9B8E88',
  alive: '#D4A847',
  heavy: '#7BA5C4',
  scattered: '#C47A7A',
  numb: '#B0A8A4',
};

const moodEmoji: Record<string, string> = {
  calm: '🌿', okay: '☁️', alive: '✨', heavy: '🌫️', scattered: '🍂', numb: '🪨',
};

interface MoodLog { mood: string; created_at: string; }

export default function PatternsPage() {
  const [moods, setMoods] = useState<MoodLog[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ daysLogged: 0, thoughtsCaptured: 0, reflectionsDone: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMoodHistory(30), getJournalEntries(), getGrowthStats()]).then(
      ([moodData, entries, statsData]) => {
        setMoods(moodData as MoodLog[]);
        const counts: Record<string, number> = {};
        (entries as { tags: string[] }[]).forEach((e) => {
          (e.tags ?? []).forEach((t: string) => { counts[t] = (counts[t] ?? 0) + 1; });
        });
        setTagCounts(counts);
        setStats(statsData);
        setLoading(false);
      }
    );
  }, []);

  const moodFrequency = moods.reduce<Record<string, number>>((acc, m) => {
    acc[m.mood] = (acc[m.mood] ?? 0) + 1;
    return acc;
  }, {});

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const maxTag = sortedTags[0]?.[1] ?? 1;

  const last14 = moods.slice(-14);

  return (
    <div className="px-5 pt-8 animate-fade-in">
      <div className="mb-7">
        <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your landscape</p>
        <h1 className="font-serif text-3xl text-warm-900">Patterns</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Growth markers */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: stats.daysLogged, label: 'days here' },
              { value: stats.thoughtsCaptured, label: 'thoughts' },
              { value: stats.reflectionsDone, label: 'reflections' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-2xl p-4 shadow-card text-center border border-warm-100">
                <p className="font-serif text-2xl text-warm-900 font-semibold">{m.value}</p>
                <p className="text-xs text-warm-400 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Last 14 days mood timeline */}
          {last14.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <p className="text-sm font-medium text-warm-700 mb-4">Last 14 days</p>
              <div className="flex items-end gap-1.5 h-12">
                {last14.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-lg"
                      style={{ height: '32px', backgroundColor: moodColors[m.mood] ?? '#C8BFB9', opacity: 0.75 }}
                      title={m.mood}
                    />
                    <span className="text-[10px] text-warm-300">
                      {new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(moodColors).map(([mood, color]) => (
                  <div key={mood} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-warm-400 capitalize">{mood}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood frequency */}
          {Object.keys(moodFrequency).length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <p className="text-sm font-medium text-warm-700 mb-4">How you've been arriving</p>
              <div className="space-y-2.5">
                {Object.entries(moodFrequency)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-base w-6">{moodEmoji[mood] ?? '·'}</span>
                      <span className="text-sm text-warm-700 capitalize w-20">{mood}</span>
                      <div className="flex-1 bg-warm-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / moods.length) * 100}%`,
                            backgroundColor: moodColors[mood] ?? '#C8BFB9',
                          }}
                        />
                      </div>
                      <span className="text-xs text-warm-400 w-6 text-right">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Thought themes */}
          {sortedTags.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <p className="text-sm font-medium text-warm-700 mb-4">What's on your mind</p>
              <div className="space-y-2.5">
                {sortedTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="text-sm text-warm-700 capitalize w-24">{tag}</span>
                    <div className="flex-1 bg-warm-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-sage transition-all"
                        style={{ width: `${(count / maxTag) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-warm-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {moods.length === 0 && Object.keys(tagCounts).length === 0 && (
            <div className="text-center py-16">
              <p className="font-serif text-2xl text-warm-300 mb-2">Nothing here yet</p>
              <p className="text-warm-400 text-sm">Start logging moods and thoughts to see your patterns</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
