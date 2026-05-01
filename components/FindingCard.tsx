'use client';

import { useState } from 'react';
import ReflectWithAI from './ReflectWithAI';
import { saveHubItem } from '@/lib/supabase';

export interface Finding {
  title: string;
  summary: string;
  source: string;
  url: string;
  field: string;
  oneWord: string;
  pubDate?: string;
}

const fieldStyles: Record<string, { badge: string; accent: string; dot: string }> = {
  'Behavioral':     { badge: 'bg-sage-pale text-sage',       accent: 'border-sage-light',  dot: 'bg-sage' },
  'I/O & Work':     { badge: 'bg-rose-pale text-rose',       accent: 'border-rose-light',  dot: 'bg-rose' },
  'Group & Social': { badge: 'bg-amber-50 text-amber-700',   accent: 'border-amber-200',   dot: 'bg-amber-400' },
  'Stress & Recovery': { badge: 'bg-blue-50 text-blue-600',  accent: 'border-blue-200',    dot: 'bg-blue-400' },
};

const fallbackStyle = { badge: 'bg-warm-100 text-warm-500', accent: 'border-warm-200', dot: 'bg-warm-300' };

export default function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const style = fieldStyles[finding.field] ?? fallbackStyle;

  const aiPrompt = `I just read a psychology finding:\n\nTitle: "${finding.title}"\n\nSummary: ${finding.summary}\n\nField: ${finding.field}\n\nHelp me connect this to my daily life. What patterns might it point to? How could I apply this today?`;

  const handleSave = async () => {
    await saveHubItem({
      type: 'finding',
      title: finding.title,
      content: finding.summary,
      source: finding.source,
      url: finding.url,
      field: finding.field,
      tags: [finding.field, finding.oneWord.toLowerCase()],
    });
    setSaved(true);
  };

  return (
    <>
      {/* Collapsed card — tap to expand */}
      <button
        onClick={() => setExpanded(true)}
        className={`w-full text-left bg-white rounded-3xl p-5 shadow-card border ${style.accent} border-opacity-60 active:scale-[0.98] transition-transform`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
            {finding.field}
          </span>
          <div className="flex items-center gap-1.5 text-warm-300">
            <span className="text-xs">tap to read</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        <p className="font-serif text-4xl font-semibold text-warm-900 mb-2 leading-none">{finding.oneWord}</p>
        <p className="text-warm-700 text-sm leading-snug font-medium mb-2">{finding.title}</p>
        <p className="text-warm-400 text-xs leading-relaxed line-clamp-2">{finding.summary}</p>

        <div className="flex items-center gap-2 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className="text-xs text-warm-300">{finding.source}</span>
          {finding.pubDate && <span className="text-xs text-warm-300">· {finding.pubDate}</span>}
        </div>
      </button>

      {/* Expanded full-screen sheet */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(61,53,48,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-cream rounded-t-4xl flex flex-col animate-slide-up"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 pt-4 pb-2 px-6">
              <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {/* Field + close */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                  {finding.field}
                </span>
                <button onClick={() => setExpanded(false)} className="text-warm-400 p-1 -mr-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* One word */}
              <p className="font-serif text-5xl font-semibold text-warm-900 mb-3 leading-none">{finding.oneWord}</p>

              {/* Title */}
              <p className="text-warm-800 text-base font-medium leading-snug mb-5">{finding.title}</p>

              {/* Full summary — no truncation */}
              <div className="bg-white rounded-2xl p-4 mb-5 border border-warm-100">
                <p className="text-xs text-warm-400 uppercase tracking-wide mb-3">Summary</p>
                <p className="text-warm-700 text-sm leading-7">{finding.summary}</p>
              </div>

              {/* Source */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <span className="text-xs text-warm-400">{finding.source}</span>
                {finding.pubDate && <span className="text-xs text-warm-300">· {finding.pubDate}</span>}
                {finding.url && (
                  <a
                    href={finding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-sage font-medium underline underline-offset-2 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    Full article ↗
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-warm-100 pb-2">
                <ReflectWithAI context={aiPrompt} label="Reflect with AI" />
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium transition-all active:scale-95 ${
                    saved ? 'bg-sage-pale text-sage' : 'bg-warm-100 text-warm-600'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {saved ? 'Saved' : 'Save to Hub'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
