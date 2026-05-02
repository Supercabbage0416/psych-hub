'use client';

import { useEffect, useState } from 'react';
import { listLessons, saveJournalEntry, getJournalEntries } from '@/lib/supabase';

interface Lesson {
  id: string; text: string; thoughts: string | null;
  createdAt: string; mood: { emoji: string; word: string };
}
interface FreeEntry { id: string; content: string; created_at: string; entry_type?: string }

function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function toDateStr(iso: string) { return iso.split('T')[0]; }

export default function JournalPage() {
  const [lessons, setLessons]   = useState<Lesson[]>([]);
  const [free, setFree]         = useState<FreeEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newThought, setNewThought] = useState('');
  const [saving, setSaving]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPattern, setAiPattern] = useState('');

  async function load() {
    const [ls, fe] = await Promise.all([
      listLessons().catch(() => []),
      getJournalEntries().catch(() => []),
    ]);
    setLessons(ls as Lesson[]);
    setFree((fe as FreeEntry[]).filter(e =>
      e.entry_type === 'raw_thought' || e.entry_type === 'free_thought'
    ));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAddThought() {
    if (!newThought.trim()) return;
    setSaving(true);
    await saveJournalEntry(newThought.trim(), [], '', 'free_thought').catch(() => {});
    setNewThought('');
    await load();
    setSaving(false);
  }

  async function handleAIAnalysis() {
    if (lessons.length < 2) return;
    setAiLoading(true);
    const context = lessons.slice(0, 14).map(l =>
      `[${l.mood.word}] "${l.text}"${l.thoughts ? ` — notes: "${l.thoughts.slice(0, 80)}"` : ''}`
    ).join('\n');
    try {
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: lessons.slice(0, 14).map(l => ({
            date: toDateStr(l.createdAt),
            mood: l.mood.word,
            lesson: l.text.slice(0, 120),
          })),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiPattern(`${d.nudge} ${d.action ? `→ ${d.action}` : ''}`);
      }
    } catch { /* ignore */ }
    setAiLoading(false);
  }

  // Group lessons by natural day
  const allDatesSet = new Set([
    ...lessons.map(l => toDateStr(l.createdAt)),
    ...free.map(f => toDateStr(f.created_at)),
  ]);
  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg, #0d1424)', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 4 }}>
          What you&apos;ve been carrying
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 30, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>
          Journal
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Add thought */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={newThought}
              onChange={e => setNewThought(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddThought(); } }}
              placeholder="Add a thought..."
              style={{
                flex: 1, padding: '11px 14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, fontSize: 14, color: 'var(--ink, #e8eef9)',
                fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(122,166,255,0.3)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button
              onClick={handleAddThought}
              disabled={saving || !newThought.trim()}
              style={{
                padding: '11px 16px', borderRadius: 14, fontSize: 14,
                background: newThought.trim() ? 'rgba(122,166,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${newThought.trim() ? 'rgba(122,166,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: newThought.trim() ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
                cursor: saving || !newThought.trim() ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}>
              {saving ? '...' : '+'}
            </button>
          </div>
        </div>

        {/* AI pattern */}
        {lessons.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            {aiPattern ? (
              <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(122,166,255,0.06)', border: '1px solid rgba(122,166,255,0.14)' }}>
                <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent, #7aa6ff)', marginBottom: 6, fontWeight: 600 }}>✦ Pattern</p>
                <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{aiPattern}</p>
                <button onClick={() => setAiPattern('')}
                  style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0, textDecoration: 'underline' }}>
                  Dismiss
                </button>
              </div>
            ) : (
              <button onClick={handleAIAnalysis} disabled={aiLoading}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 999, fontSize: 13,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--ink-3, #6b789a)', cursor: aiLoading ? 'default' : 'pointer',
                }}>
                {aiLoading ? '✦ Reading your patterns...' : '✦ Ask AI to find patterns'}
              </button>
            )}
          </div>
        )}

        {/* Entries grouped by day */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.04)', animation: 'fadeIn 0.3s ease' }} />
            ))}
          </div>
        ) : allDates.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>Nothing here yet</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)' }}>Your lessons from tonight&apos;s log will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {allDates.map(date => {
              const dayLessons = lessons.filter(l => toDateStr(l.createdAt) === date);
              const dayFree    = free.filter(f => toDateStr(f.created_at) === date);
              return (
                <div key={date}>
                  {/* Day label */}
                  <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10, paddingLeft: 2 }}>
                    {dayLabel(date + 'T12:00:00')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Lessons from tonight log */}
                    {dayLessons.map(l => (
                      <div key={l.id} style={{ borderRadius: 18, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 15 }}>{l.mood.emoji}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.mood.word}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>
                            {new Date(l.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', lineHeight: 1.5 }}>
                          {l.text}
                        </p>
                        {l.thoughts && (
                          <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', marginTop: 8, lineHeight: 1.6, fontStyle: 'italic' }}>
                            &ldquo;{l.thoughts}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Free thoughts */}
                    {dayFree.map(f => (
                      <div key={f.id} style={{ borderRadius: 18, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>thought</p>
                        <p style={{ fontSize: 15, color: 'var(--ink, #e8eef9)', lineHeight: 1.55 }}>{f.content}</p>
                      </div>
                    ))}
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
