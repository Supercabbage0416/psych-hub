'use client';

import { useEffect, useState } from 'react';
import { getJournalEntries } from '@/lib/supabase';
import { tagColors } from '@/lib/tags';
import ThoughtCapture from '@/components/ThoughtCapture';
import ReflectWithAI from '@/components/ReflectWithAI';

interface Entry {
  id: string;
  content: string;
  tags: string[];
  prompt: string;
  created_at: string;
}

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const load = () => {
    getJournalEntries().then((data) => {
      setEntries(data as Entry[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const allTags = [...new Set(entries.flatMap((e) => e.tags))];
  const filtered = activeTag ? entries.filter((e) => e.tags.includes(activeTag)) : entries;

  const weekAiContext = entries.slice(0, 7).map((e) => `"${e.content}"`).join('\n');
  const weekAiPrompt = `Here are my recent thoughts and journal entries:\n\n${weekAiContext}\n\nWhat themes or patterns do you notice? What might I be processing or working through?`;

  return (
    <div className="px-5 pt-8 animate-fade-in">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your thoughts</p>
          <h1 className="font-serif text-3xl text-warm-900">Journal</h1>
        </div>
        <button
          onClick={() => setShowCapture(true)}
          className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform"
        >
          + New
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
              !activeTag ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeTag === tag
                  ? 'bg-sage text-white border-sage'
                  : `${tagColors[tag] ?? 'bg-white text-warm-500'} border-transparent`
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* AI reflection on all entries */}
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
          <p className="font-serif text-2xl text-warm-300 mb-2">No thoughts yet</p>
          <p className="text-warm-400 text-sm">Tap + New to capture your first one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <p className="text-xs text-warm-300 mb-2">{formatEntryDate(entry.created_at)}</p>
              {entry.prompt && (
                <p className="text-xs text-warm-400 italic mb-2 line-clamp-2">"{entry.prompt}"</p>
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
          ))}
        </div>
      )}

      {showCapture && (
        <ThoughtCapture
          onClose={() => setShowCapture(false)}
          onSaved={() => { setShowCapture(false); load(); }}
        />
      )}
    </div>
  );
}
