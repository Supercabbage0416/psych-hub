'use client';

import { useEffect, useState } from 'react';
import { getMoodHistory, logMood } from '@/lib/supabase';

const moods = [
  { word: 'calm', emoji: '🌿' },
  { word: 'okay', emoji: '☁️' },
  { word: 'alive', emoji: '✨' },
  { word: 'heavy', emoji: '🌫️' },
  { word: 'scattered', emoji: '🍂' },
  { word: 'numb', emoji: '🪨' },
];

const moodEmoji: Record<string, string> = Object.fromEntries(moods.map(m => [m.word, m.emoji]));

interface MoodLog { mood: string; created_at: string; }

export default function MoodHistory() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [editing, setEditing] = useState<string | null>(null); // date string
  const [loading, setLoading] = useState(true);

  const load = () => {
    getMoodHistory(14).then(data => { setLogs(data as MoodLog[]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleEdit = async (mood: string) => {
    await logMood(mood);
    setEditing(null);
    load();
  };

  // Group by date, keep latest per day
  const byDate = logs.reduce<Record<string, string>>((acc, log) => {
    const date = log.created_at.split('T')[0];
    if (!acc[date]) acc[date] = log.mood;
    return acc;
  }, {});

  const sorted = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));

  if (loading) return null;
  if (sorted.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-warm-700">Recent moods</p>
        <p className="text-xs text-warm-400">tap to edit</p>
      </div>

      <div className="space-y-2">
        {sorted.map(([date, mood]) => {
          const isEditing = editing === date;
          const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          });
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <div key={date}>
              <button
                onClick={() => setEditing(isEditing ? null : date)}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-warm-100 transition-colors active:scale-95"
              >
                <span className="text-xl">{moodEmoji[mood] ?? '·'}</span>
                <span className="text-sm text-warm-800 capitalize flex-1 text-left">{mood}</span>
                <span className="text-xs text-warm-400">{isToday ? 'Today' : label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8BFB9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {isEditing && (
                <div className="grid grid-cols-3 gap-2 mt-2 mb-1 px-3 animate-fade-in">
                  {moods.map(m => (
                    <button
                      key={m.word}
                      onClick={() => handleEdit(m.word)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all active:scale-95 text-xs font-medium
                        ${mood === m.word
                          ? 'bg-sage-pale text-sage border-sage-light'
                          : 'bg-warm-100 text-warm-600 border-transparent'}`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <span className="capitalize">{m.word}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
