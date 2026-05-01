'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { Lesson } from '@/data/lessons.schema';

interface LessonsSectionProps {
  listLessons: (filter?: { mood?: string }) => Promise<Lesson[]>;
}

const MOOD_FILTERS = [
  { key: 'all',     label: 'All',     emoji: '' },
  { key: 'calm',    label: 'Calm',    emoji: '🌿' },
  { key: 'heavy',   label: 'Heavy',   emoji: '🌫️' },
  { key: 'anxious', label: 'Anxious', emoji: '⚡' },
  { key: 'alive',   label: 'Alive',   emoji: '✨' },
  { key: 'okay',    label: 'Okay',    emoji: '🌤️' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function LessonsSection({ listLessons }: LessonsSectionProps) {
  const [active, setActive] = useState('all');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (filter: string) => {
    setLoading(true);
    const data = await listLessons(filter === 'all' ? undefined : { mood: filter });
    setLessons(data);
    setLoading(false);
  }, [listLessons]);

  useEffect(() => { load(active); }, [active, load]);

  return (
    <div>
      <div className="chips">
        {MOOD_FILTERS.map(f => (
          <span
            key={f.key}
            className={`chip ${active === f.key ? 'active' : ''}`}
            onClick={() => setActive(f.key)}
          >
            {f.emoji && `${f.emoji} `}{f.label}
            {f.key === 'all' && lessons.length > 0 && ` (${lessons.length})`}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid var(--sage)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto',
          }} />
        </div>
      ) : lessons.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          No lessons yet. They'll appear here when you keep one from Tonight.
        </div>
      ) : (
        lessons.map(l => (
          <div className="lesson-card" key={l.id}>
            <div className="lesson-meta">
              <span className="lesson-mood">{l.mood.emoji} {l.mood.word}</span>
              <span className="lesson-date">{formatDate(l.createdAt)}</span>
            </div>
            <p className="lesson-text">{l.text}</p>
          </div>
        ))
      )}
    </div>
  );
}
