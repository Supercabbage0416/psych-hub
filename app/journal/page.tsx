'use client';

import { useEffect, useState } from 'react';
import {
  saveJournalEntry, getJournalEntries,
  updateJournalEntry, updateJournalEntryNudge, updateJournalEntryStep,
} from '@/lib/supabase';

interface Entry {
  id: string;
  content: string;
  created_at: string;
  entry_type?: string;
  ai_nudge?: string | null;
  step_status?: string | null;
  follow_up?: string | null;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
function toDateStr(iso: string) { return iso.split('T')[0]; }

// ── per-entry card ────────────────────────────────────────────────────────────

function EntryCard({ entry, onUpdate }: { entry: Entry; onUpdate: (updated: Entry) => void }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(entry.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [followUpText, setFollowUpText] = useState(entry.follow_up ?? '');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);

  async function saveEdit() {
    if (!editText.trim() || editText === entry.content) { setEditing(false); return; }
    setSavingEdit(true);
    await updateJournalEntry(entry.id, editText.trim()).catch(() => {});
    onUpdate({ ...entry, content: editText.trim() });
    setSavingEdit(false);
    setEditing(false);
  }

  async function handleAINudge() {
    if (entry.ai_nudge || aiLoading) return;
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
  }

  async function handleStep(status: 'did' | 'did_not') {
    await updateJournalEntryStep(entry.id, status).catch(() => {});
    onUpdate({ ...entry, step_status: status });
    setShowFollowUpInput(true);
  }

  async function saveFollowUp() {
    if (!followUpText.trim()) return;
    setSavingFollowUp(true);
    await updateJournalEntryStep(entry.id, entry.step_status ?? 'did', followUpText.trim()).catch(() => {});
    onUpdate({ ...entry, follow_up: followUpText.trim() });
    setSavingFollowUp(false);
    setShowFollowUpInput(false);
  }

  return (
    <div style={{ borderRadius: 18, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>thought</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>
          {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
        <button
          onClick={() => { setEditing(true); setEditText(entry.content); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, color: 'var(--ink-3, #6b789a)', fontSize: 12, opacity: 0.7 }}
          title="Edit">
          ✎
        </button>
      </div>

      {/* Content / edit */}
      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            autoFocus
            rows={4}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 12, padding: '10px 12px',
              fontSize: 15, color: 'var(--ink, #e8eef9)',
              fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
              lineHeight: 1.5, resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={saveEdit} disabled={savingEdit}
              style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, background: 'rgba(122,166,255,0.12)', border: '1px solid rgba(122,166,255,0.3)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
              {savingEdit ? 'Saving...' : 'Save'}
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

      {/* AI nudge section */}
      {!editing && (
        <div style={{ marginTop: 12 }}>
          {!entry.ai_nudge && !aiLoading && (
            <button onClick={handleAINudge}
              style={{
                fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999,
                cursor: 'pointer', padding: '5px 12px', letterSpacing: '0.06em',
              }}>
              ✦ Ask AI
            </button>
          )}
          {aiLoading && (
            <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', fontStyle: 'italic' }}>✦ thinking...</p>
          )}
          {entry.ai_nudge && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(122,166,255,0.05)', border: '1px solid rgba(122,166,255,0.12)', marginTop: 4 }}>
              <p style={{ fontSize: 10, color: 'var(--accent, #7aa6ff)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>✦ AI reflection + nudge</p>
              <p style={{ fontSize: 14, color: 'var(--ink, #e8eef9)', lineHeight: 1.6, fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontStyle: 'italic' }}>
                {entry.ai_nudge}
              </p>

              {/* Step tracking */}
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

              {/* Follow-up */}
              {entry.follow_up ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>your thoughts after</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.55, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif" }}>{entry.follow_up}</p>
                </div>
              ) : showFollowUpInput ? (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={followUpText}
                    onChange={e => setFollowUpText(e.target.value)}
                    placeholder="How did it go? What came up?"
                    autoFocus
                    rows={2}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                      padding: '8px 12px', fontSize: 13, color: 'var(--ink, #e8eef9)',
                      fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif",
                      lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button onClick={saveFollowUp} disabled={savingFollowUp || !followUpText.trim()}
                      style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, background: 'rgba(122,166,255,0.1)', border: '1px solid rgba(122,166,255,0.25)', color: 'var(--accent, #7aa6ff)', cursor: 'pointer' }}>
                      {savingFollowUp ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setShowFollowUpInput(false)}
                      style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-3, #6b789a)', cursor: 'pointer' }}>
                      Skip
                    </button>
                  </div>
                </div>
              ) : entry.step_status && (
                <button onClick={() => setShowFollowUpInput(true)}
                  style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3, #6b789a)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Add follow-up thoughts
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThought, setNewThought] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPattern, setAiPattern] = useState('');

  async function load() {
    const all = await getJournalEntries().catch(() => []) as Entry[];
    setEntries(all.filter(e =>
      !e.entry_type || e.entry_type === 'thought' || e.entry_type === 'free_thought' || e.entry_type === 'raw_thought'
    ));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleUpdate(updated: Entry) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  }

  async function handleAddThought() {
    if (!newThought.trim()) return;
    setSaving(true);
    const { data, error } = await saveJournalEntry(newThought.trim(), [], '', 'thought').catch(() => ({ data: null, error: true })) as { data: unknown; error: unknown };
    if (!error) {
      // Optimistically prepend then reload for real id/created_at
      setNewThought('');
      await load();
    }
    setSaving(false);
  }

  async function handleAIPatterns() {
    if (entries.length < 2) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: entries.slice(0, 14).map(e => ({
            date: toDateStr(e.created_at),
            mood: '',
            lesson: e.content.slice(0, 120),
          })),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiPattern(`${d.nudge}${d.action ? ` → ${d.action}` : ''}`);
      }
    } catch { /* ignore */ }
    setAiLoading(false);
  }

  const allDatesSet = new Set(entries.map(e => toDateStr(e.created_at)));
  const allDates = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg, #0d1424)', padding: '0 0 80px' }}>
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
                padding: '11px 18px', borderRadius: 14, fontSize: 14,
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

        {/* AI pattern analysis */}
        {entries.length >= 2 && (
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
              <button onClick={handleAIPatterns} disabled={aiLoading}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 999, fontSize: 13,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--ink-3, #6b789a)', cursor: aiLoading ? 'default' : 'pointer',
                }}>
                {aiLoading ? '✦ Reading your patterns...' : '✦ Find patterns across entries'}
              </button>
            )}
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : allDates.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 22, color: 'var(--ink-3, #6b789a)', marginBottom: 8 }}>Nothing here yet</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3, #6b789a)' }}>Add a thought above, or complete tonight&apos;s log.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {allDates.map(date => {
              const dayEntries = entries.filter(e => toDateStr(e.created_at) === date);
              return (
                <div key={date}>
                  <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10, paddingLeft: 2 }}>
                    {dayLabel(date + 'T12:00:00')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayEntries.map(e => (
                      <EntryCard key={e.id} entry={e} onUpdate={handleUpdate} />
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
