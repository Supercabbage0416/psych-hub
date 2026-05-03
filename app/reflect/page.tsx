'use client';

import { useEffect, useState } from 'react';
import {
  getJournalEntries, getUserArticles, saveJournalEntry,
  updateJournalEntry, updateJournalEntryNudge, updateJournalEntryStep,
  getChatSessions,
} from '@/lib/supabase';
import { getCategoriesForCheckIn } from '@/lib/articleCategories';
import { loadSession } from '@/lib/session';
import type { MoodValue } from '@/lib/checkin';
import ArticleSummaryDrawer from '@/components/ArticleSummaryDrawer';
import AIChatDrawer from '@/components/AIChatDrawer';

interface JournalEntry {
  id: string; content: string; created_at: string;
  entry_type?: string; prompt?: string;
  ai_nudge?: string | null; step_status?: string | null; follow_up?: string | null;
}
interface Article { id: string; title: string; url?: string; source?: string; created_at?: string; category_name?: string; tags?: string[] }
interface ChatSession { id: string; conversation: { role: string; content: string }[]; created_at: string; source?: string; summary?: string }

function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function toDateStr(iso: string) { return iso.split('T')[0]; }

// ── Entry card with Nudge + Chat AI selector ──────────────────────────────────

function EntryCard({ entry, onUpdate, onChat }: {
  entry: JournalEntry;
  onUpdate: (updated: JournalEntry) => void;
  onChat: (context: string) => void;
}) {
  const [editing, setEditing]         = useState(false);
  const [editText, setEditText]       = useState(entry.content);
  const [savingEdit, setSavingEdit]   = useState(false);
  const [aiMode, setAiMode]           = useState<'pick' | 'nudge' | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [followUpText, setFollowUpText] = useState(entry.follow_up ?? '');
  const [savingFollow, setSavingFollow] = useState(false);
  const [showFollow, setShowFollow]   = useState(false);

  async function saveEdit() {
    if (!editText.trim() || editText === entry.content) { setEditing(false); return; }
    setSavingEdit(true);
    await updateJournalEntry(entry.id, editText.trim()).catch(() => {});
    onUpdate({ ...entry, content: editText.trim() });
    setSavingEdit(false);
    setEditing(false);
  }

  async function handleNudge() {
    if (entry.ai_nudge || aiLoading) return;
    setAiMode('nudge');
    setAiLoading(true);
    try {
      const res = await fetch('/api/reflect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.content, mood: 'general', period: 'night', mode: 'nudge' }),
      });
      if (res.ok) {
        const d = await res.json();
        const nudge = d.nudge ?? `${d.insight} — ${d.question}`;
        await updateJournalEntryNudge(entry.id, nudge).catch(() => {});
        onUpdate({ ...entry, ai_nudge: nudge });
      }
    } catch { /* ignore */ }
    setAiLoading(false);
    setAiMode(null);
  }

  async function handleStep(status: 'did' | 'did_not') {
    await updateJournalEntryStep(entry.id, status).catch(() => {});
    onUpdate({ ...entry, step_status: status });
    setShowFollow(true);
  }

  async function saveFollowUp() {
    if (!followUpText.trim()) return;
    setSavingFollow(true);
    await updateJournalEntryStep(entry.id, entry.step_status ?? 'did', followUpText.trim()).catch(() => {});
    onUpdate({ ...entry, follow_up: followUpText.trim() });
    setSavingFollow(false);
    setShowFollow(false);
  }

  return (
    <div style={{ borderRadius: 18, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>thought</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>
          {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <button onClick={() => { setEditing(true); setEditText(entry.content); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, color: 'var(--ink-3, #6b789a)', fontSize: 12, opacity: 0.7 }}>
          ✎
        </button>
      </div>

      {editing ? (
        <div>
          <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus rows={4}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 15, color: 'var(--ink, #e8eef9)', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={saveEdit} disabled={savingEdit}
              style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, background: 'rgba(122,166,255,0.12)', border: '1px solid rgba(122,166,255,0.3)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
              {savingEdit ? '...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', lineHeight: 1.5, margin: 0 }}>
          {entry.content}
        </p>
      )}

      {/* AI section */}
      {!editing && (
        <div style={{ marginTop: 12 }}>
          {!entry.ai_nudge && !aiLoading && aiMode !== 'nudge' && (
            aiMode === 'pick' ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleNudge}
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-2, #a8b4cf)', cursor: 'pointer' }}>
                  Nudge
                </button>
                <button onClick={() => { setAiMode(null); onChat(entry.content); }}
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999, background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.25)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
                  Chat
                </button>
                <button onClick={() => setAiMode(null)}
                  style={{ fontSize: 11, padding: '5px 8px', borderRadius: 999, background: 'none', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => setAiMode('pick')}
                style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, cursor: 'pointer', padding: '5px 12px', letterSpacing: '0.06em' }}>
                ✦ Ask AI
              </button>
            )
          )}
          {aiLoading && <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>✦ thinking...</p>}

          {entry.ai_nudge && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(122,166,255,0.05)', border: '1px solid rgba(122,166,255,0.12)', marginTop: 4 }}>
              <p style={{ fontSize: 10, color: 'var(--accent, #7aa6ff)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>✦ AI nudge</p>
              <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic' }}>
                {entry.ai_nudge}
              </p>
              <button onClick={() => onChat(entry.content)}
                style={{ marginTop: 10, fontSize: 11, padding: '4px 12px', borderRadius: 999, background: 'rgba(122,166,255,0.08)', border: '1px solid rgba(122,166,255,0.2)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
                ✦ Continue in chat
              </button>

              {!entry.step_status ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleStep('did')}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 999, fontSize: 12, background: 'rgba(255,140,90,0.08)', border: '1px solid rgba(255,140,90,0.25)', color: 'var(--ember, #ff8c5a)', cursor: 'pointer' }}>
                    I did it ✓
                  </button>
                  <button onClick={() => handleStep('did_not')}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 999, fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
                    Couldn&apos;t today
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    background: entry.step_status === 'did' ? 'rgba(255,140,90,0.1)' : 'rgba(255,255,255,0.05)',
                    color: entry.step_status === 'did' ? 'var(--ember, #ff8c5a)' : 'var(--ink-3, #6b789a)',
                    border: `1px solid ${entry.step_status === 'did' ? 'rgba(255,140,90,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {entry.step_status === 'did' ? '✓ Did it' : '— Couldn\'t today'}
                  </span>
                </div>
              )}

              {entry.follow_up ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>your follow-up</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.55, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{entry.follow_up}</p>
                </div>
              ) : showFollow ? (
                <div style={{ marginTop: 10 }}>
                  <textarea value={followUpText} onChange={e => setFollowUpText(e.target.value)} placeholder="How did it go?" autoFocus rows={2}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 12px', fontSize: 13, color: 'var(--ink, #e8eef9)', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={saveFollowUp} disabled={savingFollow || !followUpText.trim()}
                      style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.25)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
                      {savingFollow ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setShowFollow(false)}
                      style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
                      Skip
                    </button>
                  </div>
                </div>
              ) : entry.step_status && (
                <button onClick={() => setShowFollow(true)}
                  style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Add follow-up
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReflectPage() {
  const [tab, setTab] = useState<'readings' | 'thoughts' | 'log'>('readings');
  const [entries, setEntries]   = useState<JournalEntry[]>([]);
  const [saved, setSaved]       = useState<Article[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [todayArticle, setTodayArticle] = useState<{ title: string; url: string; source: string; summary?: string } | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [loading, setLoading]   = useState(true);
  const [drawerArticle, setDrawerArticle] = useState<{ title: string; url: string; source: string; summary?: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState('');
  const [newThought, setNewThought] = useState('');
  const [saving, setSaving]     = useState(false);
  const [aiPattern, setAiPattern] = useState('');
  const [patternLoading, setPatternLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const [allEntries, arts, sesh] = await Promise.all([
        getJournalEntries().catch(() => []),
        getUserArticles().catch(() => []),
        getChatSessions().catch(() => []),
      ]);
      setEntries((allEntries as JournalEntry[]).filter(e =>
        !e.entry_type || e.entry_type === 'thought' || e.entry_type === 'free_thought' || e.entry_type === 'raw_thought'
      ));
      setSaved(arts as Article[]);
      setSessions(sesh as ChatSession[]);
      setLoading(false);

      try {
        const session = loadSession();
        const mood = (session.mood ?? 'calm') as MoodValue;
        const cats = getCategoriesForCheckIn({ mood });
        const key = `findings_v11_${cats[0]}`;
        const cached = localStorage.getItem(key);
        if (cached) {
          const data = JSON.parse(cached);
          const top = data.articles?.[0] ?? data.findings?.[0];
          if (top) { setTodayArticle({ title: top.title, url: top.url, source: top.source ?? '', summary: top.summary ?? '' }); setArticleLoading(false); return; }
        }
        const res = await fetch('/api/findings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood, categories: cats.slice(0, 2) }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(key, JSON.stringify(data));
          const top = data.articles?.[0] ?? data.findings?.[0];
          if (top) setTodayArticle({ title: top.title, url: top.url, source: top.source ?? '', summary: top.summary ?? '' });
        }
      } catch { /* ignore */ }
      setArticleLoading(false);
    }
    load();
  }, []);

  function handleUpdate(updated: JournalEntry) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  async function handleAddThought() {
    if (!newThought.trim()) return;
    setSaving(true);
    const { error } = await saveJournalEntry(newThought.trim(), [], '', 'thought').catch(() => ({ error: true })) as { error: unknown };
    if (!error) {
      setNewThought('');
      const all = await getJournalEntries().catch(() => []) as JournalEntry[];
      setEntries(all.filter(e => !e.entry_type || e.entry_type === 'thought' || e.entry_type === 'free_thought' || e.entry_type === 'raw_thought'));
    }
    setSaving(false);
  }

  async function handlePatterns() {
    if (entries.length < 2) return;
    setPatternLoading(true);
    try {
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: entries.slice(0, 14).map(e => ({ date: toDateStr(e.created_at), mood: '', lesson: e.content.slice(0, 120) })) }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiPattern(`${d.nudge}${d.action ? ` → ${d.action}` : ''}`);
      }
    } catch { /* ignore */ }
    setPatternLoading(false);
  }

  function openChat(context = '') { setChatContext(context); setChatOpen(true); }

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ borderRadius: 20, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', ...extra }}>
      {children}
    </div>
  );

  const thoughtEntries = entries;
  const allDatesSet = new Set(thoughtEntries.map(e => toDateStr(e.created_at)));
  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

  // Log tab: sessions grouped by date
  const logDatesSet = new Set(sessions.map(s => toDateStr(s.created_at)));
  const logDates = Array.from(logDatesSet).sort((a, b) => b.localeCompare(a));

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

      {/* 3-tab bar */}
      <div style={{ display: 'flex', gap: 4, margin: '0 20px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4 }}>
        {([
          { id: 'readings' as const, label: 'Readings' },
          { id: 'thoughts' as const, label: 'Thoughts' },
          { id: 'log'      as const, label: 'Log' },
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

        {/* ── READINGS ─────────────────────────────────────────────────────────── */}
        {tab === 'readings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8, paddingLeft: 2 }}>Today&apos;s reading</p>
              {articleLoading ? (
                <div style={{ height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : todayArticle ? (
                <button onClick={() => setDrawerArticle(todayArticle)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  {card(<>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ember, #ff8c5a)', marginBottom: 8, fontWeight: 600 }}>Matched for you</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, fontWeight: 500, color: 'var(--ink, #e8eef9)', lineHeight: 1.35, marginBottom: 6 }}>{todayArticle.title}</p>
                    {todayArticle.summary && (
                      <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' }}>{todayArticle.summary}</p>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)' }}>{todayArticle.source} · tap to read summary</p>
                  </>)}
                </button>
              ) : (
                card(<p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>No reading found for today. Check back later.</p>)
              )}
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 8, paddingLeft: 2, marginTop: 4 }}>
                Readings you&apos;ve saved
              </p>
              {loading ? null : saved.length === 0 ? (
                card(<p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>Articles you save from the daily reading will appear here.</p>)
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {saved.map(a => (
                    <div key={a.id}>
                      {a.url ? (
                        <button onClick={() => setDrawerArticle({ title: a.title, url: a.url ?? '', source: a.source ?? '' })}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                          {card(<>
                            {a.category_name && <p style={{ fontSize: 10, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{a.category_name}</p>}
                            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 16, color: 'var(--ink, #e8eef9)', lineHeight: 1.4, marginBottom: 4 }}>{a.title}</p>
                            {a.source && <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>{a.source}</p>}
                            {a.tags && a.tags.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                {a.tags.map(tag => (
                                  <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.2)', color: 'var(--accent, #7aa6ff)' }}>{tag}</span>
                                ))}
                              </div>
                            )}
                            {a.created_at && <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginTop: 6 }}>{dayLabel(a.created_at)}</p>}
                          </>)}
                        </button>
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

        {/* ── THOUGHTS ─────────────────────────────────────────────────────────── */}
        {tab === 'thoughts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Add thought + open chat */}
            <div>
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
                <button onClick={handleAddThought} disabled={saving || !newThought.trim()}
                  style={{
                    padding: '11px 18px', borderRadius: 14, fontSize: 14,
                    background: newThought.trim() ? 'rgba(122,166,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${newThought.trim() ? 'rgba(122,166,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: newThought.trim() ? 'var(--accent, #7aa6ff)' : 'var(--ink-3, #6b789a)',
                    cursor: saving || !newThought.trim() ? 'default' : 'pointer', transition: 'all 0.2s',
                  }}>
                  {saving ? '...' : '+'}
                </button>
              </div>
              <button onClick={() => openChat('')}
                style={{ marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 14, fontSize: 13, background: 'rgba(122,166,255,0.07)', border: '1px solid rgba(122,166,255,0.18)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
                ✦ Open AI chat
              </button>
            </div>

            {/* Pattern analysis */}
            {entries.length >= 2 && (
              aiPattern ? (
                <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(122,166,255,0.06)', border: '1px solid rgba(122,166,255,0.14)' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent, #7aa6ff)', marginBottom: 6, fontWeight: 600 }}>✦ Pattern</p>
                  <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{aiPattern}</p>
                  <button onClick={() => setAiPattern('')}
                    style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0, textDecoration: 'underline' }}>
                    Dismiss
                  </button>
                </div>
              ) : (
                <button onClick={handlePatterns} disabled={patternLoading}
                  style={{ width: '100%', padding: '11px 0', borderRadius: 999, fontSize: 13, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-3, #6b789a)', cursor: patternLoading ? 'default' : 'pointer' }}>
                  {patternLoading ? '✦ Reading your patterns...' : '✦ Find patterns across entries'}
                </button>
              )
            )}

            {/* Entries */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2].map(i => <div key={i} style={{ height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            ) : allDates.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>Nothing yet</p>
                <p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)' }}>Add a thought above or complete tonight&apos;s log.</p>
              </div>
            ) : allDates.map(date => {
              const dayEntries = thoughtEntries.filter(e => toDateStr(e.created_at) === date);
              return (
                <div key={date}>
                  <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10, paddingLeft: 2 }}>
                    {dayLabel(date + 'T12:00:00')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayEntries.map(e => (
                      <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} onChat={openChat} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOG ──────────────────────────────────────────────────────────────── */}
        {tab === 'log' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <button onClick={() => openChat('')}
              style={{ width: '100%', padding: '13px 0', borderRadius: 999, fontSize: 14, fontWeight: 500, background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.28)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
              ✦ Start a new chat
            </button>

            {loading ? (
              <div style={{ height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.04)' }} />
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>No chats yet</p>
                <p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)' }}>Your AI conversations will appear here, grouped by day.</p>
              </div>
            ) : logDates.map(date => {
              const daySessions = sessions.filter(s => toDateStr(s.created_at) === date);
              return (
                <div key={date}>
                  <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10, paddingLeft: 2 }}>
                    {dayLabel(date + 'T12:00:00')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {daySessions.map(s => {
                      const firstUser = s.conversation?.find((m: { role: string }) => m.role === 'user');
                      const msgCount = s.conversation?.length ?? 0;
                      let summaryObj: { bullets?: string[]; next_step?: string } | null = null;
                      try { if (s.summary) summaryObj = JSON.parse(s.summary); } catch { /* ignore */ }

                      return (
                        <div key={s.id} style={{ borderRadius: 18, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: s.source === 'recover' ? 'rgba(124,200,160,0.1)' : 'rgba(122,166,255,0.1)', border: `1px solid ${s.source === 'recover' ? 'rgba(124,200,160,0.25)' : 'rgba(122,166,255,0.2)'}`, color: s.source === 'recover' ? '#7ec8a0' : 'var(--accent, #7aa6ff)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {s.source ?? 'reflect'}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginLeft: 'auto' }}>
                              {new Date(s.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {msgCount} msgs
                            </span>
                          </div>
                          {firstUser && (
                            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 14, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: summaryObj ? 10 : 0 }}>
                              &ldquo;{(firstUser as { content: string }).content.slice(0, 120)}{(firstUser as { content: string }).content.length > 120 ? '...' : ''}&rdquo;
                            </p>
                          )}
                          {summaryObj?.bullets && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(122,166,255,0.1)' }}>
                              <p style={{ fontSize: 10, color: 'var(--accent, #7aa6ff)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>✦ Summary</p>
                              <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {summaryObj.bullets.map((b, i) => (
                                  <li key={i} style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.55, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{b}</li>
                                ))}
                              </ul>
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

      <ArticleSummaryDrawer article={drawerArticle} onClose={() => setDrawerArticle(null)} />
      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} source="reflect" initialContext={chatContext} />
    </div>
  );
}
