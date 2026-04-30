'use client';

import { useState } from 'react';
import { saveJournalEntry } from '@/lib/supabase';
import { getDailyPrompt } from '@/lib/prompts';
import { extractTags, tagColors } from '@/lib/tags';
import ReflectWithAI from './ReflectWithAI';

interface Props {
  onSaved?: () => void;
  onClose?: () => void;
}

export default function ThoughtCapture({ onSaved, onClose }: Props) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const prompt = getDailyPrompt();

  const tags = text.length > 10 ? extractTags(text) : [];

  const aiPrompt = `I was reflecting on this prompt: "${prompt}"

Here's what I wrote: "${text}"

Help me think deeper — what patterns or themes do you notice? What questions would help me explore this further?`;

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await saveJournalEntry(text.trim(), tags, prompt);
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      onSaved?.();
      onClose?.();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(61,53,48,0.25)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-cream rounded-t-4xl px-6 pt-6 pb-8 max-h-[85vh] flex flex-col"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>

        <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">Today's prompt</p>
            <p className="font-serif text-warm-800 text-base leading-snug">{prompt}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-warm-400 hover:text-warm-700 transition-colors mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write freely — no structure needed, just honest..."
          className="flex-1 min-h-[140px] resize-none bg-white rounded-2xl p-4 text-warm-800 text-sm leading-relaxed placeholder:text-warm-300 border border-warm-100 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage transition-colors"
          autoFocus
        />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tagColors[tag] ?? tagColors.reflection}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          {text.length > 20 ? (
            <ReflectWithAI context={aiPrompt} />
          ) : (
            <div />
          )}

          <button
            onClick={handleSave}
            disabled={!text.trim() || saving || done}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              done
                ? 'bg-sage text-white'
                : 'bg-sage text-white active:scale-95 disabled:opacity-40'
            }`}
          >
            {done ? '✓ Saved' : saving ? 'Saving...' : 'Save thought'}
          </button>
        </div>
      </div>
    </div>
  );
}
