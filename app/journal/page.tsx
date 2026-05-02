'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getJournalEntries, getDailyDigests, getRawThoughtsForDate,
  hasDailyDigest, saveDailyDigest,
} from '@/lib/supabase';
import { tagColors } from '@/lib/tags';
import ThoughtCapture, { ENTRY_TYPES, type EntryType } from '@/components/ThoughtCapture';
import ReflectWithAI from '@/components/ReflectWithAI';
import MoodHistory from '@/components/MoodHistory';

interface Entry {
  id: string; content: string; tags: string[];
  prompt: string; entry_type?: EntryType; created_at: string;
}

interface Digest {
  id: string; date: string; createdAt: string;
  themes: string[]; mood_arc: string;
  key_insight: string; actions: string[]; summary: string;
}

function formatEntryDate(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDigestDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

async function tryOrganizeYesterday() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (await hasDailyDigest(yesterday)) return;
  const thoughts = await getRawThoughtsForDate(yesterday);
  if (thoughts.length < 2) return;

  try {
    const res = await fetch('/api/organize-thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: yesterday, thoughts }),
    });
    if (!res.ok) return;
    const digest = await res.json();
    if (!digest.error) await saveDailyDigest(yesterday, digest);
  } catch { /* fail silently */ }
}

export default function JournalPage() {
  const [view, setView] = useState<'digest' | 'entries'>('digest');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [organizedToday, setOrganizedToday] = useState(false);
  const didOrganize = useRef(false);

  async function load() {
    const [entriesData, digestsData] = await Promise.all([
      getJournalEntries(),
      getDailyDigests(),
    ]);
    setEntries(entriesData as Entry[]);
    setDigests(digestsData);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!didOrganize.current) {
      didOrganize.current = true;
      tryOrganizeYesterday().then(() => {
        getDailyDigests().then(d => { setDigests(d); setOrganizedToday(true); });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nonDigestEntries = entries.filter(
    e => e.entry_type !== 'daily_digest' && e.entry_type !== 'raw_thought'
  );
  const rawThoughts = entries.filter(e => e.entry_type === 'raw_thought');

  const weekAiContext = nonDigestEntries.slice(0, 7)
    .map(e => `[${e.entry_type ?? 'thought'}] "${e.content}"`).join('\n');
  const weekAiPrompt = `Here are my recent journal entries:\n\n${weekAiContext}\n\nWhat themes or patterns do you notice?`;

  return (
    <div className="px-5 pt-8 pb-28 animate-fade-in">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">What you've been carrying</p>
          <h1 className="font-serif text-3xl text-warm-900">Journal</h1>
        </div>
        <button
          onClick={() => setShowCapture(true)}
          className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform"
        >
          + Thought
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl mb-5">
        <button onClick={() => setView('digest')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
            view === 'digest' ? 'bg-white text-warm-800 shadow-card' : 'text-warm-400'
          }`}>
          ✨ Daily digests
        </button>
        <button onClick={() => setView('entries')}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
            view === 'entries' ? 'bg-white text-warm-800 shadow-card' : 'text-warm-400'
          }`}>
          📝 All entries
        </button>
      </div>

      {/* Mood history */}
      <div className="mb-5">
        <MoodHistory />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse">
              <div className="h-3 bg-warm-100 rounded w-24 mb-3" />
              <div className="h-4 bg-warm-100 rounded w-full mb-2" />
              <div className="h-4 bg-warm-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : view === 'digest' ? (
        <>
          {/* Today's raw thoughts count */}
          {rawThoughts.filter(t => t.created_at.startsWith(new Date().toISOString().split('T')[0])).length > 0 && (
            <div className="bg-white rounded-2xl px-4 py-3 border border-warm-100 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-warm-400 mb-0.5">Today's thoughts</p>
                <p className="text-sm text-warm-700 font-medium">
                  {rawThoughts.filter(t => t.created_at.startsWith(new Date().toISOString().split('T')[0])).length} captured —
                  <span className="text-warm-400"> AI organizes tonight</span>
                </p>
              </div>
              <span className="text-xl">📥</span>
            </div>
          )}

          {digests.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-2xl text-warm-300 mb-2">No digests yet</p>
              <p className="text-warm-400 text-sm">Capture thoughts throughout the day — AI will organize them into a daily digest overnight.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {digests.map(d => (
                <div key={d.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-warm-400">{formatDigestDate(d.date)}</p>
                    {d.themes.length > 0 && (
                      <div className="flex gap-1.5">
                        {d.themes.slice(0, 2).map((t, i) => (
                          <span key={i} className="text-xs bg-warm-50 border border-warm-100 text-warm-500 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {d.mood_arc && (
                    <p className="text-xs text-warm-400 italic mb-2">{d.mood_arc}</p>
                  )}
                  {d.key_insight && (
                    <p className="font-serif text-warm-900 text-base leading-snug mb-3">
                      "{d.key_insight}"
                    </p>
                  )}
                  {d.summary && (
                    <p className="text-warm-600 text-sm leading-relaxed mb-3">{d.summary}</p>
                  )}
                  {d.actions.length > 0 && (
                    <div className="border-t border-warm-100 pt-3">
                      <p className="text-xs text-warm-400 mb-1.5">Worth trying:</p>
                      {d.actions.map((a, i) => (
                        <p key={i} className="text-sm text-warm-700 leading-snug mb-1">→ {a}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* AI reflection */}
          {nonDigestEntries.length >= 3 && (
            <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100 mb-5">
              <p className="text-xs text-warm-400 mb-2">See the bigger picture</p>
              <ReflectWithAI context={weekAiPrompt} label="Ask AI about my patterns" />
            </div>
          )}

          {nonDigestEntries.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-2xl text-warm-300 mb-2">Nothing here yet</p>
              <p className="text-warm-400 text-sm">Tap + Thought to capture your first entry</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nonDigestEntries.map(entry => {
                const typeConfig = entry.entry_type ? ENTRY_TYPES[entry.entry_type as EntryType] : null;
                return (
                  <div key={entry.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-warm-300">{formatEntryDate(entry.created_at)}</p>
                      {typeConfig && (
                        <span className="text-xs bg-warm-50 border border-warm-100 text-warm-500 px-2 py-0.5 rounded-full">
                          {typeConfig.icon} {typeConfig.label}
                        </span>
                      )}
                    </div>
                    {entry.prompt && (
                      <p className="text-xs text-warm-400 italic mb-2 line-clamp-1">"{entry.prompt}"</p>
                    )}
                    <p className="text-warm-800 text-sm leading-relaxed mb-3">{entry.content}</p>
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag: string) => (
                          <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tagColors[tag] ?? tagColors.reflection}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showCapture && (
        <ThoughtCapture
          quickMode
          onClose={() => setShowCapture(false)}
          onSaved={() => { setShowCapture(false); load(); }}
        />
      )}
    </div>
  );
}
