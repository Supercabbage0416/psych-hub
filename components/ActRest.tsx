'use client';

import { useEffect, useState } from 'react';
import type { Period } from '@/lib/usePeriod';
import { getCategoriesForCheckIn } from '@/lib/articleCategories';
import type { MoodValue } from '@/lib/checkin';
import { getJournalEntries } from '@/lib/supabase';

interface PatternData { moodArc: string; keyPattern: string; nudge: string; action: string }

interface Props {
  period: Period;
  mood: string;
  lesson: string;
  onExit: () => void;
}

export default function ActRest({ period, mood, lesson, onExit }: Props) {
  const [pattern, setPattern] = useState<PatternData | null>(null);
  const [article, setArticle] = useState<{ title: string; url: string; source: string; reason: string } | null>(null);
  const [loadingPattern, setLoadingPattern] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);

  const isNight = period === 'night';

  useEffect(() => {
    // Fetch AI patterns from recent sessions
    async function loadPatterns() {
      try {
        const entries = await getJournalEntries();
        const sessions = entries
          .filter((e: { entry_type?: string; content: string; created_at: string }) => e.entry_type !== 'raw_thought' && e.entry_type !== 'daily_digest')
          .slice(0, 14)
          .map((e: { content: string; created_at: string; entry_type?: string }) => ({
            date: e.created_at.split('T')[0],
            mood: (e as { mood?: string }).mood ?? mood,
            lesson: e.content.slice(0, 120),
          }));
        if (sessions.length >= 3) {
          const res = await fetch('/api/patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessions }),
          });
          if (res.ok) setPattern(await res.json());
        }
      } catch { /* fail silently */ }
      setLoadingPattern(false);
    }

    // Fetch single article matched to mood
    async function loadArticle() {
      try {
        const cats = getCategoriesForCheckIn({ mood: mood as MoodValue });
        const cached = localStorage.getItem(`findings_v11_${cats[0]}`);
        if (cached) {
          const data = JSON.parse(cached);
          const top = data.articles?.[0] ?? data.findings?.[0];
          if (top) {
            setArticle({ title: top.title, url: top.url, source: top.source ?? '', reason: data.reason ?? `matched to '${mood}'` });
          }
        }
      } catch { /* ignore */ }
      setLoadingArticle(false);
    }

    loadPatterns();
    loadArticle();
  }, [mood]);

  const restGreeting = isNight ? "You're set\nfor the evening." : "Locked in.\nNow go work.";
  const restSub      = isNight ? 'One soft thing before you go, only if you want it.' : 'A 5-minute primer to sharpen your focus before you start.';

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg-grad, var(--bg, #0d1424))',
      padding: '40px 24px calc(env(safe-area-inset-bottom) + 80px)',
    }}>
      {/* Rest scene */}
      <div style={{ position: 'relative', width: 240, height: 220, marginBottom: 8, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: -20,
          background: `radial-gradient(ellipse at center 60%, ${isNight ? 'rgba(255,140,90,0.2)' : 'rgba(196,122,58,0.12)'}, transparent 70%)`,
          filter: 'blur(20px)',
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={isNight ? '/assets/rest-armchair-night.svg' : '/assets/rest-coffee-table-day.svg'}
          alt=""
          aria-hidden="true"
          style={{ width: 240, height: 220, position: 'relative', zIndex: 1 }}
        />
      </div>

      {/* Greeting */}
      <h2 style={{
        fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 30, fontWeight: 500,
        color: 'var(--ink, #e8eef9)', textAlign: 'center', lineHeight: 1.25,
        marginBottom: 10, whiteSpace: 'pre-line',
      }}>
        {restGreeting}
      </h2>
      <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: 'var(--ink-2, #a8b4cf)', textAlign: 'center', marginBottom: 28, paddingInline: 8 }}>
        {restSub}
      </p>

      {/* AI pattern nudge */}
      {!loadingPattern && pattern && (
        <div style={{
          width: '100%', maxWidth: 380, marginBottom: 16,
          padding: '16px', borderRadius: 16,
          background: 'rgba(122,166,255,0.05)', border: '1px solid rgba(122,166,255,0.14)',
        }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent, #7aa6ff)', marginBottom: 8, fontWeight: 600 }}>
            ✦ Your pattern this week
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, marginBottom: 8, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>
            {pattern.nudge}
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>
            → {pattern.action}
          </p>
        </div>
      )}

      {/* Article card */}
      {!loadingArticle && article && (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '100%', maxWidth: 380, display: 'block',
            padding: '18px', borderRadius: 18,
            background: 'var(--surface, #1a2745)', border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            textDecoration: 'none', marginBottom: 12,
          }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ember, #ff8c5a)', marginBottom: 8, fontWeight: 600 }}>
            {isNight ? "Tonight's reading" : "Today's primer"}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)', lineHeight: 1.35, marginBottom: 6 }}>
            {article.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>
            {article.source} · matched to &apos;{mood}&apos;
          </p>
        </a>
      )}

      {/* Skip */}
      <button
        onClick={onExit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", marginTop: 8 }}>
        — {isNight ? "I'm good. Off I go." : 'Skip the reading. Go.'} —
      </button>
    </div>
  );
}
