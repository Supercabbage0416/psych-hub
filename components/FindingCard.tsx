'use client';

import { useState } from 'react';
import ReflectWithAI from './ReflectWithAI';

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
  Behavioral:   { badge: 'bg-sage-pale text-sage',   accent: 'border-sage-light' },
  'I/O & Work': { badge: 'bg-rose-pale text-rose',   accent: 'border-rose-light' },
  'Group & Social': { badge: 'bg-amber-50 text-amber-700', accent: 'border-amber-200' },
};

export default function FindingCard({ finding }: { finding: Finding }) {
  const [saved, setSaved] = useState(false);
  const style = fieldStyles[finding.field] ?? fieldStyles['Behavioral'];

  const aiPrompt = `I just read a psychology finding titled: "${finding.title}".
Summary: ${finding.summary}
Source: ${finding.source}

Help me connect this to my daily life and reflect on what it means. What patterns might it point to? How could I apply this?`;

  return (
    <div className={`bg-white rounded-3xl p-5 shadow-card border ${style.accent} border-opacity-60`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
          {finding.field}
        </span>
        <button
          onClick={() => setSaved(!saved)}
          className="text-warm-300 hover:text-rose transition-colors"
          aria-label="Save finding"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#C4959B' : 'none'} stroke={saved ? '#C4959B' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <div className="mb-3">
        <p className="font-serif text-3xl font-semibold text-warm-900 mb-1">{finding.oneWord}</p>
        <p className="text-warm-700 text-sm leading-relaxed font-medium">{finding.title}</p>
      </div>

      {finding.summary && (
        <p className="text-warm-500 text-xs leading-relaxed mb-4 line-clamp-3">{finding.summary}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href={finding.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-warm-400 hover:text-sage transition-colors underline underline-offset-2">
            {finding.source}
          </a>
          {finding.pubDate && (
            <span className="text-xs text-warm-300">· {finding.pubDate}</span>
          )}
        </div>
        <ReflectWithAI context={aiPrompt} label="Reflect" />
      </div>
    </div>
  );
}
