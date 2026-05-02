'use client';

import { useEffect, useState } from 'react';
import { getJournalEntries, getUserArticles } from '@/lib/supabase';
import { getCategoriesForCheckIn } from '@/lib/articleCategories';
import { loadSession } from '@/lib/session';
import type { MoodValue } from '@/lib/checkin';

interface JournalEntry { id: string; content: string; created_at: string; entry_type?: string; prompt?: string }
interface Article { id: string; title: string; url?: string; source?: string; created_at?: string; category_name?: string }

function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toDateStr(iso: string) { return iso.split('T')[0]; }

export default function ReflectPage() {
  const [tab, setTab]           = useState<'readings' | 'thoughts'>('readings');
  const [entries, setEntries]   = useState<JournalEntry[]>([]);
  const [saved, setSaved]       = useState<Article[]>([]);
  const [todayArticle, setTodayArticle] = useState<{ title: string; url: string; source: string } | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const [allEntries, arts] = await Promise.all([
        getJournalEntries().catch(() => []),
        getUserArticles().catch(() => []),
      ]);
      // Only show thoughts and ai_insights in the thoughts tab
      setEntries((allEntries as JournalEntry[]).filter(e =>
        e.entry_type === 'thought' || e.entry_type === 'ai_insight'
      ));
      setSaved(arts as Article[]);
      setLoading(false);

      // Today's reading: try localStorage first, then fetch
      try {
        const session = loadSession();
        const mood = (session.mood ?? 'calm') as MoodValue;
        const cats = getCategoriesForCheckIn({ mood });
        const key = `findings_v11_${cats[0]}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          const top = data.articles?.[0] ?? data.findings?.[0];
          if (top) {
            setTodayArticle({ title: top.title, url: top.url, source: top.source ?? '' });
            setArticleLoading(false);
            return;
          }
        }
        // Not cached — fetch now
        const res = await fetch('/api/findings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood, categories: cats.slice(0, 2) }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(key, JSON.stringify(data));
          const top = data.articles?.[0] ?? data.findings?.[0];
          if (top) setTodayArticle({ title: top.title, url: top.url, source: top.source ?? '' });
        }
      } catch { /* ignore */ }
      setArticleLoading(false);
    }
    load();
  }, []);

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ borderRadius: 20, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', ...extra }}>
      {children}
    </div>
  );

  // Group thoughts by date
  const allDatesSet = new Set(entries.filter(e => e.entry_type === 'thought').map(e => toDateStr(e.created_at)));
  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg, #0d1424)', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 4 }}>
          The shape of your weeks
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 30, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>
          Reflect
        </h1>
      </div>

      {/* 2-tab bar */}
      <div style={{ display: 'flex', gap: 4, margin: '0 20px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([
          { id: 'readings' as const, label: 'Readings' },
          { id: 'thoughts'  as const, label: 'Thoughts' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? 'rgba(122,166,255,0.12)' : 'transparent',
              color: tab === t.id ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* ── READINGS ── */}
        {tab === 'readings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Today's reading */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8, paddingLeft: 2 }}>
                Today&apos;s reading
              </p>
              {articleLoading ? (
                <div style={{ height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : todayArticle ? (
                <a href={todayArticle.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                  {card(<>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ember, #ff8c5a)', marginBottom: 8, fontWeight: 600 }}>Matched for you</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)', lineHeight: 1.35, marginBottom: 6 }}>{todayArticle.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>{todayArticle.source}</p>
                  </>)}
                </a>
              ) : (
                card(<p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>No reading found for today. Check back later.</p>)
              )}
            </div>

            {/* Saved readings */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8, paddingLeft: 2, marginTop: 4 }}>
                Readings you&apos;ve saved
              </p>
              {loading ? null : saved.length === 0 ? (
                card(<p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>
                  Articles you save from the daily reading will appear here.
                </p>)
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {saved.map(a => (
                    <div key={a.id}>
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                          {card(<>
                            {a.category_name && <p style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{a.category_name}</p>}
                            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', lineHeight: 1.4, marginBottom: 4 }}>{a.title}</p>
                            {a.source && <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>{a.source}</p>}
                            {a.created_at && <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginTop: 4 }}>{dayLabel(a.created_at)}</p>}
                          </>)}
                        </a>
                      ) : card(<>
                        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', lineHeight: 1.4 }}>{a.title}</p>
                        {a.source && <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginTop: 4 }}>{a.source}</p>}
                      </>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── THOUGHTS ── */}
        {tab === 'thoughts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {loading ? (
              <div style={{ height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.04)' }} />
            ) : allDates.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>Nothing yet</p>
                <p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)' }}>Your thoughts from tonight&apos;s log will appear here.</p>
              </div>
            ) : allDates.map(date => {
              const dayThoughts = entries.filter(e => e.entry_type === 'thought' && toDateStr(e.created_at) === date);
              const dayInsights = entries.filter(e => e.entry_type === 'ai_insight' && toDateStr(e.created_at) === date);
              return (
                <div key={date}>
                  <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10, paddingLeft: 2 }}>
                    {dayLabel(date + 'T12:00:00')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayThoughts.map(t => {
                      const insight = dayInsights.find(i => i.prompt === t.content);
                      return (
                        <div key={t.id} style={{ borderRadius: 18, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>thought</p>
                          <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 15, color: 'var(--ink, #e8eef9)', lineHeight: 1.55 }}>{t.content}</p>
                          {insight && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(122,166,255,0.12)' }}>
                              <p style={{ fontSize: 10, color: 'var(--accent, #7aa6ff)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>✦ AI reflection</p>
                              <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.6, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{insight.content}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
