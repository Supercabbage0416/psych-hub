'use client';

import { useEffect, useState } from 'react';
import { getJournalEntries } from '@/lib/supabase';
import { tagColors } from '@/lib/tags';
import ThoughtCapture, { ENTRY_TYPES, type EntryType } from '@/components/ThoughtCapture';
import ReflectWithAI from '@/components/ReflectWithAI';
import MoodHistory from '@/components/MoodHistory';

interface Entry {
  id: string;
  content: string;
  tags: string[];
  prompt: string;
  entry_type?: EntryType;
  created_at: string;
}

const TYPE_FILTER_ORDER: (EntryType | 'all')[] = [
  'all', 'mood_note', 'small_win', 'stress_trigger', 'social_moment',
  'shame_replay', 'recovery_action', 'article_thought', 'meaning_note',
];

function formatEntryDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [captureType, setCaptureType] = useState<EntryType | undefined>(undefined);
  const [activeType, setActiveType] = useState<EntryType | 'all'>('all');

  const load = () => {
    getJournalEntries().then((data) => {
      setEntries(data as Entry[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = activeType === 'all'
    ? entries
    : entries.filter(e => e.entry_type === activeType);

  const weekAiContext = entries.slice(0, 7).map((e) => `[${e.entry_type ?? 'thought'}] "${e.content}"`).join('\n');
  const weekAiPrompt = `Here are my recent journal entries:\n\n${weekAiContext}\n\nWhat themes or patterns do you notice? What might I be processing or working through?`;

  function openCapture(type?: EntryType) {
    setCaptureType(type);
    setShowCapture(true);
  }

  return (
    <div className="px-5 pt-8 pb-28 animate-fade-in">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your thoughts</p>
          <h1 className="font-serif text-3xl text-warm-900">Journal</h1>
        </div>
        <button
          onClick={() => openCapture()}
          className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform"
        >
          + New
        </button>
      </div>

      {/* Quick capture row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        {(['mood_note', 'small_win', 'stress_trigger', 'social_moment', 'shame_replay'] as EntryType[]).map(t => {
          const c = ENTRY_TYPES[t];
          return (
            <button key={t} onClick={() => openCapture(t)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-warm-100 rounded-full px-3 py-2 text-xs font-medium text-warm-600 active:scale-95 transition-transform">
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mood history */}
      <div className="mb-5">
        <MoodHistory />
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {TYPE_FILTER_ORDER.map(t => {
          const count = t === 'all' ? entries.length : entries.filter(e => e.entry_type === t).length;
          if (count === 0 && t !== 'all') return null;
          const c = t === 'all' ? null : ENTRY_TYPES[t];
          return (
            <button key={t}
              onClick={() => setActiveType(t)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeType === t ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'
              }`}>
              {c ? `${c.icon} ${c.label}` : `All (${count})`}
              {c && count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* AI reflection */}
      {entries.length >= 3 && (
        <div className="bg-white rounded-2xl p-4 shadow-card border border-warm-100 mb-5">
          <p className="text-xs text-warm-400 mb-2">See the bigger picture</p>
          <ReflectWithAI context={weekAiPrompt} label="Ask AI about my patterns" />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse">
              <div className="h-3 bg-warm-100 rounded w-24 mb-3" />
              <div className="h-4 bg-warm-100 rounded w-full mb-2" />
              <div className="h-4 bg-warm-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-warm-300 mb-2">Nothing here yet</p>
          <p className="text-warm-400 text-sm">Tap + New to capture your first thought</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const typeConfig = entry.entry_type ? ENTRY_TYPES[entry.entry_type] : null;
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

      {showCapture && (
        <ThoughtCapture
          initialType={captureType}
          onClose={() => { setShowCapture(false); setCaptureType(undefined); }}
          onSaved={() => { setShowCapture(false); setCaptureType(undefined); load(); }}
        />
      )}
    </div>
  );
}
