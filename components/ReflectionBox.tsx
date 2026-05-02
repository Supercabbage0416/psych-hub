'use client';

import React, { useRef, useState } from 'react';
import BurnAnimation from './BurnAnimation';
import StoreAnimation from './StoreAnimation';

interface ReflectionBoxProps {
  currentMood: { emoji: string; word: string };
  onBurn: (input: { lesson: string; mood: { emoji: string; word: string } }) => Promise<void>;
  onStore: (input: { lesson: string; thoughts: string; mood: { emoji: string; word: string } }) => Promise<void>;
}

type Phase = 'idle' | 'reframing' | 'burning' | 'storing';

export default function ReflectionBox({ currentMood, onBurn, onStore }: ReflectionBoxProps) {
  const [thoughts, setThoughts] = useState('');
  const [lesson, setLesson] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [reframed, setReframed] = useState<string | null>(null);
  const [usingReframed, setUsingReframed] = useState(false);
  const reframeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ready = thoughts.trim().length > 0 && lesson.trim().length > 0;
  const finalLesson = usingReframed && reframed ? reframed : lesson;

  function handleLessonBlur() {
    if (lesson.trim().length < 8) return;
    if (reframeTimer.current) clearTimeout(reframeTimer.current);
    reframeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'reframe', lesson: lesson.trim(), mood: currentMood.word }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.reframed && data.reframed !== lesson.trim()) {
          setReframed(data.reframed);
        }
      } catch { /* fail silently */ }
    }, 400);
  }

  async function handleBurn() {
    if (!ready || phase !== 'idle') return;
    setPhase('burning');
    document.body.setAttribute('data-ritual', 'burning');
    setTimeout(() => document.body.removeAttribute('data-ritual'), 700);
    await onBurn({ lesson: finalLesson.trim(), mood: currentMood });
    setTimeout(() => { setThoughts(''); setLesson(''); setReframed(null); setUsingReframed(false); setPhase('idle'); }, 2600);
  }

  async function handleStore() {
    if (!ready || phase !== 'idle') return;
    setPhase('storing');
    await onStore({ lesson: finalLesson.trim(), thoughts: thoughts.trim(), mood: currentMood });
    setTimeout(() => { setThoughts(''); setLesson(''); setReframed(null); setUsingReframed(false); setPhase('idle'); }, 2200);
  }

  return (
    <div className={`reflect-box ${phase === 'burning' ? 'burning' : ''} ${phase === 'storing' ? 'storing' : ''}`}>
      <div className="reflect-eyebrow">By the fire</div>
      <div className="reflect-title">Want to set something down?</div>

      <div className="reflect-prompt">
        <span className="num">1</span> Share your thoughts
      </div>
      <textarea
        className="reflect-textarea"
        placeholder="Whatever's heavy. Nothing has to make sense here."
        value={thoughts}
        onChange={e => setThoughts(e.target.value)}
        disabled={phase !== 'idle'}
        rows={3}
      />

      <div className="reflect-prompt" style={{ marginTop: 16 }}>
        <span className="num">2</span> What did you take from it?
      </div>
      <textarea
        className="reflect-textarea"
        placeholder="A small lesson. One sentence is enough."
        value={lesson}
        onChange={e => { setLesson(e.target.value); setReframed(null); setUsingReframed(false); }}
        onBlur={handleLessonBlur}
        disabled={phase !== 'idle'}
        rows={2}
      />

      {/* AI reframe suggestion */}
      {reframed && phase === 'idle' && !usingReframed && (
        <div style={{
          marginTop: 8,
          background: 'rgba(149,176,217,0.08)',
          border: '1px solid rgba(149,176,217,0.15)',
          borderRadius: 'var(--r-md)',
          padding: '10px 12px',
        }}>
          <p style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 600, marginBottom: 4 }}>
            ✨ AI polished this as:
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{reframed}"
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setUsingReframed(true)}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--sage)',
                background: 'rgba(149,176,217,0.12)', border: '1px solid rgba(149,176,217,0.2)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              Use this
            </button>
            <button
              onClick={() => setReframed(null)}
              style={{
                fontSize: 11, color: 'var(--text-dim)', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px 4px',
              }}
            >
              Keep mine
            </button>
          </div>
        </div>
      )}

      {/* Using reframed indicator */}
      {usingReframed && reframed && phase === 'idle' && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--sage)' }}>✨ Using polished version</span>
          <button
            onClick={() => setUsingReframed(false)}
            style={{ fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Undo
          </button>
        </div>
      )}

      {ready && phase === 'idle' && (
        <>
          <div className="ai-hint">
            The lesson can stay with you. The thoughts don't have to. Either is fine.
          </div>
          <div className="reflect-actions">
            <button className="reflect-btn burn" onClick={handleBurn}>
              🔥 Burn the thoughts
            </button>
            <button className="reflect-btn store" onClick={handleStore}>
              ✨ Keep the lesson
            </button>
          </div>
          <div className="reflect-hint-bottom">
            Lessons go to <span style={{ color: 'var(--sage)' }}>Reflect → Lessons</span>.
            Thoughts disappear when burned.
          </div>
        </>
      )}

      {!ready && phase === 'idle' && (
        <div className="reflect-hint-bottom" style={{ marginTop: 18 }}>
          Fill both to choose what to do.
        </div>
      )}

      {phase === 'burning' && <BurnAnimation />}
      {phase === 'storing' && <StoreAnimation />}
    </div>
  );
}
