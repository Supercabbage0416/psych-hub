'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Period } from '@/lib/usePeriod';
import { saveSession } from '@/lib/session';
import { createLesson } from '@/lib/supabase';

const MOOD_LABELS: Record<string, string> = {
  calm: 'calm', heavy: 'heavy', anxious: 'anxious', alive: 'alive', tender: 'tender',
  locked_in: 'locked in', scattered: 'scattered', wired: 'wired', sharp: 'sharp', foggy: 'foggy',
  okay: 'okay', numb: 'numb',
};

interface AIResponse { insight: string; question: string }

interface Props {
  period: Period;
  mood: string;
  initialThoughts?: string;
  initialLesson?: string;
  onComplete: (lesson: string, thoughts: string) => void;
}

export default function ActReflect({ period, mood, initialThoughts = '', initialLesson = '', onComplete }: Props) {
  const [thoughts, setThoughts] = useState(initialThoughts);
  const [lesson, setLesson] = useState(initialLesson);
  const [burning, setBurning] = useState(false);
  const [done, setDone] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNight = period === 'night';
  const moodLabel = MOOD_LABELS[mood] ?? mood;

  const thoughtsPrompt = isNight
    ? "What's one thought worth setting down tonight?"
    : "What's the ONE thing that moves the needle today?";
  const lessonLabel = isNight ? "Tonight's lesson — what you'll keep" : "Today's focus — what you'll ship";
  const burnLabel   = isNight ? '🍃 Set it down' : '📌 Lock this in';
  const burnSub     = isNight ? 'come back to it later if needed' : 'park the noise, attack the focus';

  // Auto-save to localStorage on change
  useEffect(() => {
    saveSession({ thoughts, lesson });
  }, [thoughts, lesson]);

  // AI assist on lesson blur / typing
  const triggerAI = useCallback(async (text: string) => {
    if (text.length < 25 || aiState === 'loading') return;
    setAiState('loading');
    try {
      const res = await fetch('/api/reflect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mood, period }),
      });
      if (!res.ok) throw new Error();
      const data: AIResponse = await res.json();
      setAiResponse(data);
      setAiState('ready');
    } catch {
      setAiState('idle');
    }
  }, [mood, period, aiState]);

  function handleLessonChange(val: string) {
    setLesson(val);
    setAiState('idle');
    setAiResponse(null);
    if (aiTimer.current) clearTimeout(aiTimer.current);
    if (val.length >= 25) {
      aiTimer.current = setTimeout(() => triggerAI(val), 1200);
    }
  }

  async function handleBurn() {
    if (!lesson.trim() && !thoughts.trim()) return;
    setBurning(true);
    try {
      if (lesson.trim()) {
        await createLesson({ text: lesson.trim(), mood: { emoji: '🌙', word: moodLabel } });
      }
      saveSession({ thoughtsBurned: true, lesson: lesson.trim(), thoughts: '' });
    } catch { /* fail silently */ }
    setBurning(false);
    setDone(true);
    setTimeout(() => onComplete(lesson.trim(), thoughts.trim()), 600);
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-grad, var(--bg, #0d1424))',
      padding: '0 0 40px',
    }}>
      {/* Arch scene */}
      <div style={{
        position: 'relative',
        width: '100%', height: 260,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Arch background */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 260,
          borderRadius: '50% 50% 0 0 / 30% 30% 0 0',
          background: isNight
            ? 'linear-gradient(180deg, #1a1410 0%, #2a1a0a 60%, #3a1a08 100%)'
            : 'linear-gradient(180deg, #ede8dc 0%, #ddd5c0 100%)',
          boxShadow: isNight
            ? '0 0 60px rgba(255,140,90,0.25), inset 0 0 40px rgba(255,100,50,0.08)'
            : '0 0 40px rgba(180,150,90,0.15)',
        }} />
        {/* SVG scene */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isNight ? '/assets/scene-fireplace-night.svg' : '/assets/scene-coffee-day.svg'}
          alt=""
          aria-hidden="true"
          style={{
            position: 'relative', zIndex: 1,
            width: isNight ? 200 : 140,
            height: 'auto',
            filter: isNight ? 'drop-shadow(0 0 24px rgba(255,140,90,0.5))' : 'none',
          }}
        />
        {/* Mood context pill */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '5px 14px',
          fontSize: 12, color: 'var(--ink-2, #a8b4cf)',
          fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic',
          whiteSpace: 'nowrap',
        }}>
          {isNight ? `You arrived feeling ${moodLabel}` : `You said you feel ${moodLabel}`}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Main prompt */}
        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, fontWeight: 500, color: 'var(--ink, #e8eef9)', lineHeight: 1.3, marginBottom: 20 }}>
          {thoughtsPrompt}
        </p>

        {/* Thoughts field */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'var(--ember, #ff8c5a)', marginBottom: 8 }}>
            {isNight ? 'What you&apos;re carrying' : 'The noise to park'}
          </label>
          <textarea
            value={thoughts}
            onChange={e => setThoughts(e.target.value)}
            placeholder={isNight ? 'Just put it here. No structure needed.' : "What's pulling your attention? List it."}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '12px 14px',
              fontSize: 14, color: 'var(--ink, #e8eef9)',
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              lineHeight: 1.6, resize: 'none', outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--divider, rgba(255,255,255,0.08))', margin: '4px 0 16px' }} />

        {/* Lesson field */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: 'var(--ink-2, #a8b4cf)', marginBottom: 8 }}>
            {lessonLabel}
          </label>
          <textarea
            value={lesson}
            onChange={e => handleLessonChange(e.target.value)}
            placeholder={isNight ? 'One thing worth keeping from today...' : 'One thing to lock in and execute on...'}
            rows={2}
            maxLength={200}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '12px 14px',
              fontSize: 14, color: 'var(--ink, #e8eef9)',
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              lineHeight: 1.6, resize: 'none', outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
          {lesson.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', textAlign: 'right', marginTop: 4 }}>
              {lesson.length}/200
            </p>
          )}
        </div>

        {/* AI assist panel */}
        {aiState === 'loading' && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(122,166,255,0.06)', border: '1px solid rgba(122,166,255,0.12)', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>✦ reading what you wrote...</p>
          </div>
        )}
        {aiState === 'ready' && aiResponse && (
          <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(122,166,255,0.06)', border: '1px solid rgba(122,166,255,0.15)', marginBottom: 12 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent, #7aa6ff)', marginBottom: 8, fontWeight: 600 }}>✦ AI reflection</p>
            <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, marginBottom: 10, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>
              {aiResponse.insight}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>
              {aiResponse.question}
            </p>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", marginBottom: 20, lineHeight: 1.55 }}>
          {isNight
            ? 'Your lesson is always saved. You choose what happens to the noise.'
            : 'Your focus is saved. Everything else gets parked.'}
        </p>

        {/* Burn button */}
        <button
          onClick={handleBurn}
          disabled={burning || done || (!lesson.trim() && !thoughts.trim())}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 999,
            fontSize: 16, fontWeight: 600,
            fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
            background: done
              ? 'rgba(122,166,255,0.15)'
              : isNight
                ? 'rgba(255,140,90,0.12)'
                : 'rgba(59,111,214,0.12)',
            border: `1px solid ${done ? 'rgba(122,166,255,0.3)' : isNight ? 'rgba(255,140,90,0.3)' : 'rgba(59,111,214,0.3)'}`,
            color: done ? 'var(--accent, #7aa6ff)' : isNight ? 'var(--ember, #ff8c5a)' : 'var(--accent, #3b6fd6)',
            cursor: burning || done ? 'default' : 'pointer',
            transition: 'all 0.25s',
            opacity: (!lesson.trim() && !thoughts.trim()) ? 0.4 : 1,
          }}>
          {done ? '✓ Saved' : burning ? 'Saving...' : burnLabel}
        </button>
        {!done && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", marginTop: 8 }}>
            {burnSub}
          </p>
        )}
      </div>
    </div>
  );
}
