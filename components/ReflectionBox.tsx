'use client';

import React, { useState } from 'react';
import BurnAnimation from './BurnAnimation';
import StoreAnimation from './StoreAnimation';

interface ReflectionBoxProps {
  currentMood: { emoji: string; word: string };
  onBurn: (input: { lesson: string; mood: { emoji: string; word: string } }) => Promise<void>;
  onStore: (input: { lesson: string; thoughts: string; mood: { emoji: string; word: string } }) => Promise<void>;
}

type Phase = 'idle' | 'burning' | 'storing';

export default function ReflectionBox({ currentMood, onBurn, onStore }: ReflectionBoxProps) {
  const [thoughts, setThoughts] = useState('');
  const [lesson, setLesson] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  const ready = thoughts.trim().length > 0 && lesson.trim().length > 0;

  async function handleBurn() {
    if (!ready || phase !== 'idle') return;
    setPhase('burning');
    document.body.setAttribute('data-ritual', 'burning');
    setTimeout(() => document.body.removeAttribute('data-ritual'), 700);
    await onBurn({ lesson: lesson.trim(), mood: currentMood });
    setTimeout(() => { setThoughts(''); setLesson(''); setPhase('idle'); }, 2600);
  }

  async function handleStore() {
    if (!ready || phase !== 'idle') return;
    setPhase('storing');
    await onStore({ lesson: lesson.trim(), thoughts: thoughts.trim(), mood: currentMood });
    setTimeout(() => { setThoughts(''); setLesson(''); setPhase('idle'); }, 2200);
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
        onChange={e => setLesson(e.target.value)}
        disabled={phase !== 'idle'}
        rows={2}
      />

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

      {!ready && (
        <div className="reflect-hint-bottom" style={{ marginTop: 18 }}>
          Fill both to choose what to do.
        </div>
      )}

      {phase === 'burning' && <BurnAnimation />}
      {phase === 'storing' && <StoreAnimation />}
    </div>
  );
}
