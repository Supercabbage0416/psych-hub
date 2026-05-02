'use client';

import { useState } from 'react';
import { saveJournalEntry } from '@/lib/supabase';
import { getDailyPrompt } from '@/lib/prompts';
import { extractTags, tagColors } from '@/lib/tags';
import ReflectWithAI from './ReflectWithAI';

export type EntryType =
  | 'mood_note'
  | 'social_moment'
  | 'shame_replay'
  | 'stress_trigger'
  | 'article_thought'
  | 'recovery_action'
  | 'small_win'
  | 'meaning_note'
  | 'free'
  | 'raw_thought'
  | 'daily_digest';

interface EntryTypeConfig {
  label: string;
  icon: string;
  prompt: string;
  placeholder: string;
}

export const ENTRY_TYPES: Record<EntryType, EntryTypeConfig> = {
  mood_note: {
    label: 'Mood note',
    icon: '🌡️',
    prompt: 'What are you feeling right now?',
    placeholder: 'Describe what\'s present — even if it\'s unclear or contradictory...',
  },
  social_moment: {
    label: 'Social moment',
    icon: '👥',
    prompt: 'What happened in that interaction?',
    placeholder: 'Just the facts — what was said or done, nothing added or removed...',
  },
  shame_replay: {
    label: 'Shame replay',
    icon: '🔁',
    prompt: 'What happened, and what did your mind say it meant?',
    placeholder: 'Write what happened, then what your mind told you about it...',
  },
  stress_trigger: {
    label: 'Stress trigger',
    icon: '⚡',
    prompt: 'What triggered the stress or tension?',
    placeholder: 'What happened just before you felt stressed? What was at stake?',
  },
  article_thought: {
    label: 'Article thought',
    icon: '📖',
    prompt: 'What did that article remind you of in your own life?',
    placeholder: 'What resonated? Where does this show up for you?',
  },
  recovery_action: {
    label: 'Recovery reflection',
    icon: '🌱',
    prompt: 'What happened after you tried today\'s small action?',
    placeholder: 'How did it feel? Did anything surprise you?',
  },
  small_win: {
    label: 'Small win',
    icon: '✓',
    prompt: 'What went right today, even slightly?',
    placeholder: 'It doesn\'t have to be impressive — small still counts...',
  },
  meaning_note: {
    label: 'Meaning note',
    icon: '✨',
    prompt: 'What still feels meaningful right now?',
    placeholder: 'What still matters, even on a difficult day?',
  },
  free: {
    label: 'Free write',
    icon: '✏️',
    prompt: getDailyPrompt(),
    placeholder: 'Write freely — no structure needed, just honest...',
  },
};

const TYPE_QUICK: EntryType[] = [
  'mood_note', 'small_win', 'stress_trigger', 'social_moment',
  'shame_replay', 'article_thought', 'recovery_action', 'meaning_note',
];

interface Props {
  onSaved?: () => void;
  onClose?: () => void;
  initialType?: EntryType;
  contextNote?: string;
  quickMode?: boolean; // frictionless quick dump — no type selector, saves as raw_thought
}

export default function ThoughtCapture({ onSaved, onClose, initialType, contextNote, quickMode }: Props) {
  const [entryType, setEntryType] = useState<EntryType>(initialType ?? 'free');
  const [showTypeSelector, setShowTypeSelector] = useState(!initialType && !quickMode);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const config = ENTRY_TYPES[entryType];
  const tags = text.length > 10 ? extractTags(text) : [];

  const aiPrompt = `I was reflecting with this prompt: "${config.prompt}"

Entry type: ${config.label}
${contextNote ? `Context: ${contextNote}\n` : ''}
What I wrote: "${text}"

Help me think deeper — what patterns or themes do you notice?`;

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const type = quickMode ? 'raw_thought' as EntryType : entryType;
    const prompt = quickMode ? '' : config.prompt;
    const saveTags = quickMode ? [] : tags;
    await saveJournalEntry(text.trim(), saveTags, prompt, type);
    setSaving(false);
    setDone(true);
    setTimeout(() => { onSaved?.(); onClose?.(); }, 800);
  };

  if (quickMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{ background: 'rgba(10,18,32,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <div className="bg-cream rounded-t-4xl px-6 pt-5 pb-8"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
          onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-3">
            <p className="font-serif text-warm-900 text-lg">What&apos;s on your mind?</p>
            {onClose && (
              <button onClick={onClose} className="text-warm-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-warm-400 mb-3">Dump it here — AI organizes it into your daily digest later.</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Anything at all. Half-formed thoughts are fine."
            className="w-full min-h-[120px] resize-none bg-white rounded-2xl p-4 text-warm-800 text-sm leading-relaxed placeholder:text-warm-300 border border-warm-100 focus:outline-none focus:border-sage transition-colors"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving || done}
            className={`w-full mt-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              done ? 'bg-sage text-white' : 'bg-sage text-white active:scale-95 disabled:opacity-40'
            }`}
          >
            {done ? '✓ Captured' : saving ? 'Saving...' : 'Capture thought'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(10,18,32,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-cream rounded-t-4xl px-6 pt-5 pb-8 max-h-[90vh] flex flex-col"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>

        <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-4" />

        {/* Type selector (shown when no initial type) */}
        {showTypeSelector ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-warm-700">What kind of thought?</p>
              {onClose && (
                <button onClick={onClose} className="text-warm-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {TYPE_QUICK.map(t => {
                const c = ENTRY_TYPES[t];
                return (
                  <button key={t}
                    onClick={() => { setEntryType(t); setShowTypeSelector(false); }}
                    className="flex items-center gap-2.5 bg-white border border-warm-100 rounded-2xl px-3 py-3.5 text-left active:scale-95 transition-transform">
                    <span className="text-base">{c.icon}</span>
                    <span className="text-xs font-medium text-warm-700">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setEntryType('free'); setShowTypeSelector(false); }}
              className="w-full py-3 bg-white border border-warm-100 rounded-2xl text-sm text-warm-500">
              ✏️ Just write freely
            </button>
          </>
        ) : (
          <>
            {/* Active type header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{config.icon}</span>
                  <button onClick={() => setShowTypeSelector(true)}
                    className="text-xs text-warm-400 bg-warm-50 border border-warm-100 px-2 py-0.5 rounded-full">
                    {config.label} ↓
                  </button>
                </div>
                {contextNote && (
                  <p className="text-xs text-warm-300 mb-1 italic">{contextNote}</p>
                )}
                <p className="font-serif text-warm-800 text-base leading-snug">{config.prompt}</p>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-warm-400 mt-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={config.placeholder}
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
                  done ? 'bg-sage text-white' : 'bg-sage text-white active:scale-95 disabled:opacity-40'
                }`}
              >
                {done ? '✓ Saved' : saving ? 'Saving...' : 'Save thought'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
