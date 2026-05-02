'use client';

import { useEffect, useState } from 'react';

interface Article {
  title: string;
  url: string;
  source: string;
  summary?: string; // raw RSS desc used as input for AI
}

interface Props {
  article: Article | null;
  onClose: () => void;
}

interface AISummary {
  bullets: string[];
  why: string;
}

export default function ArticleSummaryDrawer({ article, onClose }: Props) {
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!article) return;
    setAiSummary(null);
    setError(false);
    setLoading(true);

    fetch('/api/summarize-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        desc: article.summary ?? '',
        source: article.source,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.bullets) setAiSummary(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [article]);

  if (!article) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg, #0d1424)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px 24px 0 0',
        padding: '0 0 calc(env(safe-area-inset-bottom) + 24px)',
        maxHeight: '85svh',
        overflowY: 'auto',
        animation: 'slideUp 0.3s cubic-bezier(0.2,0.8,0.2,1)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        <div style={{ padding: '12px 22px 0' }}>
          {/* Source + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: 'var(--ember, #ff8c5a)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              {article.source}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ink-2, #a8b4cf)', fontSize: 16,
            }}>×</button>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
            fontSize: 22, fontWeight: 500, color: 'var(--ink, #e8eef9)',
            lineHeight: 1.3, marginBottom: 20,
          }}>
            {article.title}
          </h2>

          {/* Summary content */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic', marginBottom: 6 }}>✦ Summarising...</p>
              {[80, 95, 70].map((w, i) => (
                <div key={i} style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.06)', width: `${w}%`, animation: 'pulse 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          )}

          {error && (
            <p style={{ fontSize: 14, color: 'var(--ink-2, #a8b4cf)', fontStyle: 'italic', marginBottom: 24 }}>
              Couldn&apos;t generate a summary — open the full article below.
            </p>
          )}

          {aiSummary && (
            <div style={{ marginBottom: 24 }}>
              {/* Why this matters */}
              {aiSummary.why && (
                <div style={{
                  padding: '12px 14px', borderRadius: 14, marginBottom: 16,
                  background: 'rgba(255,140,90,0.06)', border: '1px solid rgba(255,140,90,0.14)',
                }}>
                  <p style={{ fontSize: 11, color: 'var(--ember, #ff8c5a)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>Why this matters</p>
                  <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.55, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic' }}>
                    {aiSummary.why}
                  </p>
                </div>
              )}

              {/* Bullet points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aiSummary.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: 'var(--accent, #7aa6ff)', fontWeight: 700, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <p style={{
                      fontSize: 15, color: 'var(--ink, #e8eef9)', lineHeight: 1.55,
                      fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                    }}>
                      {b}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Read full article CTA */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px 0', textAlign: 'center',
              borderRadius: 999, fontSize: 14, fontWeight: 600,
              background: 'rgba(122,166,255,0.08)', border: '1px solid rgba(122,166,255,0.2)',
              color: 'var(--accent, #7aa6ff)', textDecoration: 'none',
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
            }}>
            Read full article →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
