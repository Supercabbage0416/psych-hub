'use client';

import { useEffect, useState } from 'react';
import { getHubItems, deleteHubItem, saveHubItem, getNudgeEntries, updateJournalEntryStep } from '@/lib/supabase';
import { loadState } from '@/lib/recovery/storage';
import { getTodayMood } from '@/lib/supabase';

// ── Nudge entry types ──────────────────────────────────────────────────────────
interface NudgeEntry {
  id: string; content: string; ai_nudge: string;
  step_status?: string | null; follow_up?: string | null;
  created_at: string;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Single nudge card ──────────────────────────────────────────────────────────
function NudgeCard({ entry, onUpdate }: { entry: NudgeEntry; onUpdate: (e: NudgeEntry) => void }) {
  const [followUpText, setFollowUpText] = useState(entry.follow_up ?? '');
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepQuestion, setDeepQuestion] = useState('');

  async function markStep(status: 'did' | 'did_not') {
    await updateJournalEntryStep(entry.id, status).catch(() => {});
    onUpdate({ ...entry, step_status: status });
    setShowInput(true);
  }

  async function saveFollowUp() {
    if (!followUpText.trim()) return;
    setSaving(true);
    await updateJournalEntryStep(entry.id, entry.step_status ?? 'did', followUpText.trim()).catch(() => {});
    onUpdate({ ...entry, follow_up: followUpText.trim() });
    setSaving(false);
    setShowInput(false);
  }

  async function getDeepReflection() {
    if (deepLoading || deepQuestion) return;
    setDeepLoading(true);
    try {
      const context = `Original thought: "${entry.content}"\nAI nudge: "${entry.ai_nudge}"\nThey ${entry.step_status === 'did' ? 'did the step' : "couldn't do it today"}.${entry.follow_up ? `\nReflection: "${entry.follow_up}"` : ''}`;
      const res = await fetch('/api/reflect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: context, mood: 'general', period: 'night', mode: 'nudge' }),
      });
      if (res.ok) {
        const d = await res.json();
        setDeepQuestion(d.nudge ?? d.insight ?? '');
      }
    } catch { /* ignore */ }
    setDeepLoading(false);
  }

  const statusColor = entry.step_status === 'did'
    ? { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#16a34a' }
    : entry.step_status === 'did_not'
    ? { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', text: '#64748b' }
    : null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-warm-300">{dayLabel(entry.created_at)}</span>
        {statusColor && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: statusColor.bg, border: `1px solid ${statusColor.border}`, color: statusColor.text }}>
            {entry.step_status === 'did' ? '✓ Did it' : '— Couldn\'t today'}
          </span>
        )}
      </div>

      {/* Original thought */}
      <p className="text-warm-400 text-xs italic mb-3 leading-relaxed border-l-2 border-warm-100 pl-3">
        "{entry.content.slice(0, 140)}{entry.content.length > 140 ? '…' : ''}"
      </p>

      {/* AI nudge */}
      <div className="bg-amber-50 rounded-2xl p-3.5 mb-3 border border-amber-100">
        <p className="text-xs text-amber-600 uppercase tracking-wide font-medium mb-1.5">✦ AI nudge</p>
        <p className="text-sm text-warm-800 leading-relaxed">{entry.ai_nudge}</p>
      </div>

      {/* Step buttons */}
      {!entry.step_status && (
        <div className="flex gap-2 mb-2">
          <button onClick={() => markStep('did')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-green-200 bg-green-50 text-green-700 active:scale-98 transition-transform">
            I did it ✓
          </button>
          <button onClick={() => markStep('did_not')}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-warm-100 text-warm-500 active:scale-98 transition-transform">
            Couldn&apos;t today
          </button>
        </div>
      )}

      {/* Follow-up */}
      {entry.follow_up ? (
        <div className="mt-1">
          <p className="text-xs text-warm-400 mb-1 uppercase tracking-wide">Your reflection</p>
          <p className="text-sm text-warm-600 italic leading-relaxed">"{entry.follow_up}"</p>
          {!deepQuestion && (
            <button onClick={getDeepReflection} disabled={deepLoading}
              className="text-xs text-sage mt-2 underline underline-offset-2 cursor-pointer bg-transparent border-none">
              {deepLoading ? '✦ thinking deeper...' : '✦ Go one level deeper'}
            </button>
          )}
          {deepQuestion && (
            <div className="mt-3 bg-sage-pale rounded-2xl p-3 border border-sage/20">
              <p className="text-xs text-sage uppercase tracking-wide font-medium mb-1.5">✦ Next reflection</p>
              <p className="text-sm text-warm-700 leading-relaxed italic">{deepQuestion}</p>
            </div>
          )}
        </div>
      ) : showInput ? (
        <div className="mt-2">
          <textarea
            value={followUpText}
            onChange={e => setFollowUpText(e.target.value)}
            placeholder="How did it go? What came up for you?"
            autoFocus
            rows={2}
            className="w-full bg-cream rounded-xl px-3 py-2.5 text-sm text-warm-800 border border-warm-100 focus:outline-none focus:border-sage resize-none placeholder:text-warm-300 mb-2"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowInput(false)}
              className="flex-1 py-2 rounded-xl text-sm border border-warm-200 text-warm-500">
              Skip
            </button>
            <button onClick={saveFollowUp} disabled={saving || !followUpText.trim()}
              className="flex-1 py-2 rounded-xl text-sm bg-sage text-white font-medium disabled:opacity-40">
              {saving ? '...' : 'Save reflection'}
            </button>
          </div>
        </div>
      ) : entry.step_status && (
        <button onClick={() => setShowInput(true)}
          className="text-xs text-warm-400 underline underline-offset-2 mt-1 bg-transparent border-none cursor-pointer">
          Add reflection
        </button>
      )}
    </div>
  );
}

// ── Nudges Dashboard ───────────────────────────────────────────────────────────
function NudgesDashboard() {
  const [nudges, setNudges] = useState<NudgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'did' | 'did_not'>('all');

  useEffect(() => {
    getNudgeEntries().then(data => {
      setNudges(data as NudgeEntry[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handleUpdate(updated: NudgeEntry) {
    setNudges(prev => prev.map(n => n.id === updated.id ? updated : n));
  }

  const filtered = nudges.filter(n => {
    if (filter === 'pending') return !n.step_status;
    if (filter === 'did') return n.step_status === 'did';
    if (filter === 'did_not') return n.step_status === 'did_not';
    return true;
  });

  const pendingCount = nudges.filter(n => !n.step_status).length;
  const doneCount    = nudges.filter(n => n.step_status === 'did').length;

  return (
    <div>
      {/* Stats row */}
      {nudges.length > 0 && (
        <div className="flex gap-3 mb-4">
          {[
            { label: 'Total nudges', value: nudges.length },
            { label: 'Completed', value: doneCount },
            { label: 'Pending', value: pendingCount },
          ].map(s => (
            <div key={s.label} className="flex-1 bg-white rounded-2xl p-3 border border-warm-100 text-center shadow-card">
              <p className="font-serif text-2xl text-warm-800">{s.value}</p>
              <p className="text-xs text-warm-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {nudges.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {([
            { id: 'all' as const, label: `All (${nudges.length})` },
            { id: 'pending' as const, label: `Pending (${pendingCount})` },
            { id: 'did' as const, label: `Done (${doneCount})` },
            { id: 'did_not' as const, label: `Skipped (${nudges.filter(n => n.step_status === 'did_not').length})` },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                filter === f.id ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-3xl border border-warm-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-warm-300 mb-2">
            {nudges.length === 0 ? 'No nudges yet' : 'Nothing here'}
          </p>
          <p className="text-warm-400 text-sm">
            {nudges.length === 0
              ? 'Open a journal entry and tap ✦ Ask AI to get your first nudge'
              : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => <NudgeCard key={n.id} entry={n} onUpdate={handleUpdate} />)}
        </div>
      )}
    </div>
  );
}

type Collection = 'explains_me' | 'helps_recover' | 'meaningful' | 'revisit';

interface HubItem {
  id: string; type: string; title: string; content: string;
  source: string; url: string; field: string; tags: string[];
  collection?: Collection; save_reason?: string;
  stage_at_save?: string; mood_at_save?: string;
  created_at: string;
}

const COLLECTIONS: { id: Collection; label: string; icon: string; desc: string }[] = [
  { id: 'explains_me', label: 'Explains me', icon: '🪞', desc: 'Things that help me understand myself' },
  { id: 'helps_recover', label: 'Helps me recover', icon: '🌱', desc: 'Things that support my recovery' },
  { id: 'meaningful', label: 'Still meaningful', icon: '✨', desc: 'Things that still matter to me' },
  { id: 'revisit', label: 'Want to revisit', icon: '🔖', desc: 'Things to return to' },
];

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  finding: { label: 'Finding', icon: '🔬', color: 'bg-sage-pale text-sage' },
  article: { label: 'Article', icon: '📄', color: 'bg-rose-pale text-rose' },
  note: { label: 'Note', icon: '✏️', color: 'bg-amber-50 text-amber-700' },
};

// After saving, prompt user: "What about this felt meaningful?"
interface MeaningfulPromptProps {
  item: Partial<HubItem>;
  onDone: (collection: Collection, reason: string) => void;
  onSkip: () => void;
}

function MeaningfulPrompt({ item, onDone, onSkip }: MeaningfulPromptProps) {
  const [selected, setSelected] = useState<Collection | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(10,18,32,0.70)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-cream rounded-t-4xl px-6 pt-6 pb-10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}>
        <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-5" />
        <p className="font-serif text-xl text-warm-900 mb-1">Before you save this…</p>
        <p className="text-warm-400 text-sm mb-1 leading-snug">
          "{item.title?.slice(0, 60)}{(item.title?.length ?? 0) > 60 ? '…' : ''}"
        </p>
        <p className="text-warm-600 text-sm mb-5 mt-3">What about this felt meaningful or useful?</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {COLLECTIONS.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-2xl border text-left transition-all ${
                selected === c.id ? 'bg-white border-sage shadow-card' : 'bg-white border-warm-100'
              }`}>
              <span className="text-base">{c.icon}</span>
              <span className="text-xs font-medium text-warm-700">{c.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Optional note — what did this remind you of, or why does it matter?"
          rows={2}
          className="w-full bg-white border border-warm-100 rounded-2xl px-3 py-2.5 text-sm text-warm-800 placeholder-warm-300 resize-none focus:outline-none focus:border-sage mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onSkip}
            className="flex-1 py-3 rounded-2xl border border-warm-200 text-warm-500 text-sm">
            Skip
          </button>
          <button onClick={() => selected && onDone(selected, reason)}
            disabled={!selected}
            className="flex-1 py-3 rounded-2xl bg-sage text-white text-sm font-medium disabled:opacity-40">
            Save to Hub
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HubPage() {
  const [tab, setTab] = useState<'saved' | 'nudges'>('saved');
  const [items, setItems] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState<Collection | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [pendingNote, setPendingNote] = useState<Partial<HubItem> | null>(null);

  const load = () => {
    getHubItems().then((data) => { setItems(data as HubItem[]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((item) => {
    const matchCollection = activeCollection === 'all' || item.collection === activeCollection;
    const matchSearch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.content?.toLowerCase().includes(search.toLowerCase()) ||
      item.save_reason?.toLowerCase().includes(search.toLowerCase());
    return matchCollection && matchSearch;
  });

  // Topic analysis — what fields/tags appear most often
  const fieldCounts = items.reduce<Record<string, number>>((acc, i) => {
    if (i.field) acc[i.field] = (acc[i.field] ?? 0) + 1;
    return acc;
  }, {});
  const topFields = Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const handleNoteInitiate = async () => {
    if (!noteTitle.trim()) return;
    const todayMood = await getTodayMood().catch(() => null);
    let stage = '';
    try { stage = loadState().currentStage; } catch {}
    setPendingNote({
      type: 'note',
      title: noteTitle.trim(),
      content: noteText.trim(),
      mood_at_save: todayMood ?? '',
      stage_at_save: stage,
    });
    setNoteTitle('');
    setNoteText('');
    setShowNoteForm(false);
  };

  const handleMeaningfulDone = async (collection: Collection, reason: string) => {
    if (!pendingNote) return;
    await saveHubItem({
      type: (pendingNote.type ?? 'note') as 'finding' | 'article' | 'note',
      title: pendingNote.title ?? '',
      content: pendingNote.content,
      collection,
      save_reason: reason,
      mood_at_save: pendingNote.mood_at_save,
      stage_at_save: pendingNote.stage_at_save,
    });
    setPendingNote(null);
    load();
  };

  const handleMeaningfulSkip = async () => {
    if (!pendingNote) return;
    await saveHubItem({
      type: (pendingNote.type ?? 'note') as 'finding' | 'article' | 'note',
      title: pendingNote.title ?? '',
      content: pendingNote.content,
    });
    setPendingNote(null);
    load();
  };

  return (
    <div className="px-5 pt-8 pb-28 animate-fade-in">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">What you&apos;re keeping</p>
          <h1 className="font-serif text-3xl text-warm-900">Keepsakes</h1>
        </div>
        {tab === 'saved' && (
          <button onClick={() => setShowNoteForm(!showNoteForm)}
            className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform">
            + Note
          </button>
        )}
      </div>

      {/* Top tab switcher */}
      <div className="flex gap-2 mb-5 bg-warm-50 rounded-2xl p-1 border border-warm-100">
        {([{ id: 'saved', label: 'Saved' }, { id: 'nudges', label: '✦ Nudges' }] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-card text-warm-800 border border-warm-100' : 'text-warm-400'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'nudges' && <NudgesDashboard />}

      {tab === 'saved' && <>
      {/* Topic pattern — what you keep returning to */}
      {topFields.length > 0 && (
        <div className="bg-white rounded-2xl px-4 py-3.5 border border-warm-100 shadow-card mb-4">
          <p className="text-xs text-warm-400 mb-2">Topics you keep returning to</p>
          <div className="flex gap-2 flex-wrap">
            {topFields.map(([field, count]) => (
              <span key={field} className="text-xs bg-sage-pale text-sage px-2.5 py-1 rounded-full font-medium">
                {field} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your library..."
          className="w-full bg-white rounded-2xl pl-9 pr-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300" />
      </div>

      {/* Collection tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        <button onClick={() => setActiveCollection('all')}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
            activeCollection === 'all' ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'
          }`}>
          All ({items.length})
        </button>
        {COLLECTIONS.map(c => {
          const count = items.filter(i => i.collection === c.id).length;
          return (
            <button key={c.id} onClick={() => setActiveCollection(c.id === activeCollection ? 'all' : c.id)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeCollection === c.id ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'
              }`}>
              {c.icon} {c.label} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Add note form */}
      {showNoteForm && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100 mb-4">
          <p className="text-xs text-warm-400 mb-3">Capture a thought or insight</p>
          <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="What's the title or headline?"
            className="w-full bg-cream rounded-xl px-3 py-2.5 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage mb-2 placeholder:text-warm-300" />
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
            placeholder="Your idea, quote, or observation..."
            rows={3}
            className="w-full bg-cream rounded-xl px-3 py-2.5 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage resize-none placeholder:text-warm-300 mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setShowNoteForm(false)}
              className="flex-1 py-2.5 border border-warm-200 text-warm-600 rounded-xl text-sm">Cancel</button>
            <button onClick={handleNoteInitiate} disabled={!noteTitle.trim()}
              className="flex-1 py-2.5 bg-sage text-white rounded-xl text-sm font-medium disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Active collection description */}
      {activeCollection !== 'all' && (
        <p className="text-xs text-warm-400 mb-4 italic">
          {COLLECTIONS.find(c => c.id === activeCollection)?.desc}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-warm-300 mb-2">
            {activeCollection === 'all' ? 'Your hub is empty' : 'Nothing here yet'}
          </p>
          <p className="text-warm-400 text-sm">
            {activeCollection === 'all'
              ? 'Save findings, articles, or add notes to build your library'
              : `Save items to "${COLLECTIONS.find(c => c.id === activeCollection)?.label}" as you go`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.note;
            const collectionInfo = COLLECTIONS.find(c => c.id === item.collection);
            return (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                    {collectionInfo && (
                      <span className="text-xs px-2 py-0.5 bg-warm-100 text-warm-500 rounded-full">
                        {collectionInfo.icon} {collectionInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-xs text-warm-300">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={async () => { await deleteHubItem(item.id); load(); }}
                      className="text-warm-200 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="font-medium text-warm-800 text-sm mb-1.5 leading-snug">{item.title}</h3>
                {item.content && (
                  <p className="text-warm-500 text-xs leading-relaxed line-clamp-3">{item.content}</p>
                )}
                {item.save_reason && (
                  <p className="text-warm-400 text-xs italic mt-2 border-t border-warm-100 pt-2">
                    "{item.save_reason}"
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {item.field && <p className="text-xs text-warm-300">{item.field}</p>}
                  {item.stage_at_save && (
                    <p className="text-xs text-warm-300">Stage: {item.stage_at_save}</p>
                  )}
                </div>
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-warm-100 text-warm-500 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sage underline underline-offset-2 mt-2 block">Read original →</a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Meaningful prompt modal */}
      {pendingNote && (
        <MeaningfulPrompt
          item={pendingNote}
          onDone={handleMeaningfulDone}
          onSkip={handleMeaningfulSkip}
        />
      )}
      </>}
    </div>
  );
}
