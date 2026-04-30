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

const fieldStyles: Record<string, { badge: string; accent: string }> = {
  Behavioral:       { badge: 'bg-sage-pale text-sage',         accent: 'border-sage-light' },
  'I/O & Work':     { badge: 'bg-rose-pale text-rose',         accent: 'border-rose-light' },
  'Group & Social': { badge: 'bg-amber-50 text-amber-700',     accent: 'border-amber-200' },
};

export default function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const style = fieldStyles[finding.field] ?? fieldStyles['Behavioral'];

  const aiPrompt = `I just read a psychology finding titled: "${finding.title}".\nSummary: ${finding.summary}\nSource: ${finding.source}\n\nHelp me connect this to my daily life and reflect on what it means.`;

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
      {/* Card */}
      <button
        onClick={() => setExpanded(true)}
        className={`w-full text-left bg-white rounded-3xl p-5 shadow-card border ${style.accent} border-opacity-60 active:scale-[0.98] transition-transform`}
      >
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
            {finding.field}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8BFB9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        <p className="font-serif text-3xl font-semibold text-warm-900 mb-1">{finding.oneWord}</p>
        <p className="text-warm-700 text-sm leading-snug font-medium mb-2">{finding.title}</p>
        {finding.summary && (
          <p className="text-warm-400 text-xs leading-relaxed line-clamp-2">{finding.summary}</p>
        )}
        <p className="text-xs text-warm-300 mt-2">
          {finding.source}{finding.pubDate ? ` · ${finding.pubDate}` : ''} · tap to read
        </p>
      </button>

      {/* Expanded modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(61,53,48,0.35)', backdropFilter: 'blur(6px)' }}
          onClick={() => setExpanded(false)}>
          <div
            className="bg-cream rounded-t-4xl px-6 pt-6 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                {finding.field}
              </span>
              <button onClick={() => setExpanded(false)} className="text-warm-400 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* One word */}
            <p className="font-serif text-4xl font-semibold text-warm-900 mb-3">{finding.oneWord}</p>

            {/* Title */}
            <p className="text-warm-800 text-base font-medium leading-snug mb-4">{finding.title}</p>

            {/* Full summary */}
            {finding.summary && (
              <div className="bg-white rounded-2xl p-4 mb-4 border border-warm-100">
                <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">Summary</p>
                <p className="text-warm-700 text-sm leading-relaxed">{finding.summary}</p>
              </div>
            )}

            {/* Source + read link */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs text-warm-400">{finding.source}</span>
              {finding.pubDate && <span className="text-xs text-warm-300">· {finding.pubDate}</span>}
              {finding.url && (
                <a href={finding.url} target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-xs text-sage font-medium underline underline-offset-2">
                  Read full article ↗
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-warm-100">
              <ReflectWithAI context={aiPrompt} label="Reflect with AI" />
              <button
                onClick={handleSave}
                disabled={saved}
                className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-medium transition-all ${
                  saved ? 'bg-sage-pale text-sage' : 'bg-warm-100 text-warm-600 active:scale-95'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {saved ? 'Saved to Hub' : 'Save to Hub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
