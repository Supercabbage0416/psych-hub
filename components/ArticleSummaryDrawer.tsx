'use client';

import { useEffect, useState } from 'react';

interface Article {
  title: string;
  url: string;
  source: string;
  summary?: string;
}

interface Props {
  article: Article | null;
  onClose: () => void;
}

interface AISummary {
  finding: string;
  meaning: string;
  tension: string;
  action: string;
}

const SECTIONS: { key: keyof AISummary; label: string; sub: string; accent: string; bg: string; border: string }[] = [
  {
    key: 'finding',
    label: 'What it found',
    sub: 'The core claim or result',
    accent: '#95B0D9',
    bg: 'rgba(149,176,217,0.06)',
    border: 'rgba(149,176,217,0.18)',
  },
  {
    key: 'meaning',
    label: 'What this means',
    sub: 'For how we think, feel, or behave',
    accent: '#a8b4cf',
    bg: 'rgba(168,180,207,0.05)',
    border: 'rgba(168,180,207,0.14)',
  },
  {
    key: 'tension',
    label: 'The honest nuance',
    sub: 'Where it gets complicated',
    accent: '#E89B6C',
    bg: 'rgba(232,155,108,0.05)',
    border: 'rgba(232,155,108,0.16)',
  },
  {
    key: 'action',
    label: 'One thing to try',
    sub: 'Small, concrete, this week',
    accent: '#7aa6ff',
    bg: 'rgba(122,166,255,0.07)',
    border: 'rgba(122,166,255,0.2)',
  },
];

export default function ArticleSummaryDrawer({ article, onClose }: Props) {
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(false);

  useEffect(() => {
    if (!article) return;
    setAiSummary(null);
    setError(false);
    setLoading(true);

    fetch('/api/summarize-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: article.title, desc: article.summary ?? '', source: article.source }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.finding) setAiSummary(d); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [article]);

  if (!article) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg, #0d1424)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        padding: '0 0 calc(env(safe-area-inset-bottom) + 28px)',
        maxHeight: '90svh',
        overflowY: 'auto',
        animation: 'slideUp 0.28s cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <div style={{ padding: '8px 22px 0' }}>
          {/* Top row: source + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--ember, #ff8c5a)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              {article.source}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ink-2, #a8b4cf)', fontSize: 18, lineHeight: 1,
            }}>×</button>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
            fontSize: 21, fontWeight: 500, color: 'var(--ink, #e8eef9)',
            lineHeight: 1.3, marginBottom: 22,
          }}>
            {article.title}
          </h2>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic', marginBottom: 4 }}>✦ Interpreting...</p>
              {SECTIONS.map((s, i) => (
                <div key={i} style={{ borderRadius: 14, padding: '14px 16px', background: s.bg, border: `1px solid ${s.border}` }}>
                  <div style={{ height: 10, borderRadius: 5, background: s.border, width: '40%', marginBottom: 10 }} />
                  <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)', width: '90%', marginBottom: 6 }} />
                  <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', width: '70%' }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p style={{ fontSize: 14, color: 'var(--ink-2, #a8b4cf)', fontStyle: 'italic', marginBottom: 24 }}>
              Couldn&apos;t interpret this article — open the original below.
            </p>
          )}

          {/* 4-part framework */}
          {aiSummary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
              {SECTIONS.map(s => (
                <div key={s.key} style={{
                  borderRadius: 16, padding: '14px 16px',
                  background: s.bg, border: `1px solid ${s.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>
                      {s.sub}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 15, color: 'var(--ink, #e8eef9)', lineHeight: 1.6,
                    fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                  }}>
                    {aiSummary[s.key]}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Read full article */}
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '15px 0', borderRadius: 999,
            fontSize: 15, fontWeight: 600,
            background: 'rgba(122,166,255,0.12)', border: '1px solid rgba(122,166,255,0.3)',
            color: 'var(--accent, #7aa6ff)', textDecoration: 'none',
            fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
            letterSpacing: '0.01em',
          }}>
            Read full article
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
