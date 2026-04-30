'use client';

import { useEffect, useState } from 'react';
import { getMoodHistory, getJournalEntries } from '@/lib/supabase';
import { getThemesFromEntries } from '@/lib/nlp';

const moodEmoji: Record<string, string> = {
  calm: '🌿', okay: '☁️', alive: '✨', heavy: '🌫️', scattered: '🍂', numb: '🪨',
};

const moodColors: Record<string, string> = {
  calm: '#7A9A6E', okay: '#9B8E88', alive: '#D4A847',
  heavy: '#7BA5C4', scattered: '#C47A7A', numb: '#B0A8A4',
};

interface MoodLog { mood: string; created_at: string; }

export default function MonthlyCalendar() {
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [themes, setThemes] = useState<string[]>([]);
  const [moodDist, setMoodDist] = useState<Record<string, number>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    Promise.all([getMoodHistory(31), getJournalEntries()]).then(([moodData, entries]) => {
      const map: Record<string, string> = {};
      const dist: Record<string, number> = {};
      (moodData as MoodLog[]).forEach((m) => {
        const day = m.created_at.split('T')[0];
        map[day] = m.mood;
        dist[m.mood] = (dist[m.mood] ?? 0) + 1;
      });
      setMoods(map);
      setMoodDist(dist);
      setThemes(getThemesFromEntries(entries as { content: string }[]));
      setLoading(false);
    });
  }, []);

  const topMood = Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0];
  const totalDays = Object.keys(moodDist).reduce((s, k) => s + moodDist[k], 0);

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-sm font-medium text-warm-700 mb-4">{monthName}</p>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-warm-300 font-medium">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const mood = moods[dateStr];
            const isToday = dateStr === now.toISOString().split('T')[0];
            const isSelected = selectedDay === dateStr;

            return (
              <button key={dateStr} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all
                  ${isToday ? 'ring-2 ring-sage ring-offset-1' : ''}
                  ${isSelected ? 'bg-sage-pale' : mood ? 'bg-warm-100' : 'bg-gray-50'}
                  ${mood ? 'hover:bg-sage-pale' : 'opacity-40'}
                `}
              >
                {mood ? (
                  <>
                    <span className="text-base leading-none">{moodEmoji[mood] ?? '·'}</span>
                    <span className="text-warm-400 mt-0.5" style={{ fontSize: '9px' }}>{day}</span>
                  </>
                ) : (
                  <span className="text-warm-300" style={{ fontSize: '10px' }}>{day}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {!loading && totalDays > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100">
            <p className="text-xs text-warm-400 mb-1">Most common mood</p>
            <p className="text-2xl">{topMood ? (moodEmoji[topMood[0]] ?? '·') : '—'}</p>
            <p className="text-sm text-warm-700 capitalize mt-0.5">{topMood?.[0] ?? '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100">
            <p className="text-xs text-warm-400 mb-1">Days checked in</p>
            <p className="font-serif text-2xl text-warm-900">{totalDays}</p>
            <p className="text-xs text-warm-400 mt-0.5">this month</p>
          </div>
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-sm font-medium text-warm-700 mb-3">What's been on your mind</p>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, i) => (
              <span key={theme}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-sage-pale text-sage"
                style={{ opacity: 1 - i * 0.1 }}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mood distribution */}
      {Object.keys(moodDist).length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
          <p className="text-sm font-medium text-warm-700 mb-3">This month's emotional landscape</p>
          <div className="space-y-2.5">
            {Object.entries(moodDist).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <div key={mood} className="flex items-center gap-3">
                <span className="text-base w-6">{moodEmoji[mood] ?? '·'}</span>
                <span className="text-sm text-warm-700 capitalize w-20">{mood}</span>
                <div className="flex-1 bg-warm-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${(count / totalDays) * 100}%`, backgroundColor: moodColors[mood] ?? '#C8BFB9' }} />
                </div>
                <span className="text-xs text-warm-400 w-6 text-right">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
