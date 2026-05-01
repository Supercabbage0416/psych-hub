'use client';

import { useState } from 'react';
import ReflectWithAI from './ReflectWithAI';
import { saveHubItem } from '@/lib/supabase';

export interface Finding {
  title: string;
  summary: string;
  finding?: string;
  context?: string;
  population?: string;
  implication?: string;
  source: string;
  url: string;
  field: string;
  oneWord: string;
  pubDate?: string;
  alternates?: { title: string; url: string; source: string; pubDate: string; desc: string }[];
}

const fieldStyles: Record<string, { badge: string; accent: string; dot: string }> = {
  'Behavioral':        { badge: 'bg-sage-pale text-sage',      accent: 'border-sage-light', dot: 'bg-sage' },
  'I/O & Work':        { badge: 'bg-rose-pale text-rose',      accent: 'border-rose-light', dot: 'bg-rose' },
  'Group & Social':    { badge: 'bg-amber-50 text-amber-700',  accent: 'border-amber-200',  dot: 'bg-amber-400' },
  'Stress & Recovery': { badge: 'bg-blue-50 text-blue-600',    accent: 'border-blue-200',   dot: 'bg-blue-400' },
};
const fallbackStyle = { badge: 'bg-warm-100 text-warm-500', accent: 'border-warm-200', dot: 'bg-warm-300' };

const SECTIONS = [
  { key: 'finding' as const,    label: 'Finding' },
  { key: 'context' as const,    label: 'Context' },
  { key: 'population' as const, label: 'Population' },
  { key: 'implication' as const,label: 'Implication' },
];

type HubCollection = 'explains_me' | 'helps_recover' | 'meaningful' | 'revisit';
const HUB_COLLECTIONS: { id: HubCollection; label: string; icon: string }[] = [
  { id: 'explains_me', label: 'Explains me', icon: '🪞' },
  { id: 'helps_recover', label: 'Helps me recover', icon: '🌱' },
  { id: 'meaningful', label: 'Still meaningful', icon: '✨' },
  { id: 'revisit', label: 'Want to revisit', icon: '🔖' },
];

export default function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHubPrompt, setShowHubPrompt] = useState(false);
  const [hubCollection, setHubCollection] = useState<HubCollection | null>(null);
  const [hubReason, setHubReason] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const style = fieldStyles[finding.field] ?? fallbackStyle;

  const totalArticles = 1 + (finding.alternates?.length ?? 0);
  const hasAlternates = totalArticles > 1;

  const currentTitle   = activeIdx === 0 ? finding.title   : finding.alternates![activeIdx - 1].title;
  const currentUrl     = activeIdx === 0 ? finding.url     : finding.alternates![activeIdx - 1].url;
  const currentSource  = activeIdx === 0 ? finding.source  : finding.alternates![activeIdx - 1].source;
  const currentPubDate = activeIdx === 0 ? finding.pubDate : finding.alternates![activeIdx - 1].pubDate;

  const hasStructured = !!(finding.finding || finding.context || finding.population || finding.implication);

  const aiPrompt = `I just read a psychology finding:\n\nTitle: "${finding.title}"\nField: ${finding.field}\n\nFinding: ${finding.finding ?? finding.summary}\nImplication: ${finding.implication ?? ''}\n\nHelp me connect this to my daily life. What patterns might it point to? How could I apply this today?`;

  const handleSaveInitiate = () => {
    setShowHubPrompt(true);
  };

  const handleSaveConfirm = async () => {
    await saveHubItem({
      type: 'finding',
      title: finding.title,
      content: finding.summary,
      source: finding.source,
      url: finding.url,
      field: finding.field,
      tags: [finding.field, finding.oneWord.toLowerCase()],
      collection: hubCollection ?? undefined,
      save_reason: hubReason || undefined,
    });
    setShowHubPrompt(false);
    setSaved(true);
  };

  const close = () => { setExpanded(false); setActiveIdx(0); };

  return (
    <>
      {/* Collapsed card */}
      <button
        onClick={() => setExpanded(true)}
        className={`w-full text-left bg-white rounded-3xl p-5 shadow-card border ${style.accent} border-opacity-60 active:scale-[0.98] transition-transform`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
            {finding.field}
          </span>
          <div className="flex items-center gap-1.5 text-warm-300">
            {hasAlternates && <span className="text-xs">{totalArticles} articles</span>}
            <span className="text-xs">tap to read</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        <p className="font-serif text-4xl font-semibold text-warm-900 mb-2 leading-none">{finding.oneWord}</p>
        <p className="text-warm-700 text-sm leading-snug font-medium mb-2">{finding.title}</p>
        <p className="text-warm-400 text-xs leading-relaxed line-clamp-2">
          {finding.finding ?? finding.summary}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className="text-xs text-warm-300">{finding.source}</span>
          {finding.pubDate && <span className="text-xs text-warm-300">· {finding.pubDate}</span>}
        </div>
      </button>

      {/* Expanded bottom sheet */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(61,53,48,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={close}
        >
          <div
            className="bg-cream rounded-t-4xl flex flex-col animate-slide-up"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 pt-4 pb-2 px-6">
              <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Field + close */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                  {finding.field}
                </span>
                <button onClick={close} className="text-warm-400 p-1 -mr-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Article selector */}
              {hasAlternates && (
                <div className="flex gap-2 mb-5">
                  {Array.from({ length: totalArticles }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        activeIdx === i
                          ? `${style.badge} border-transparent`
                          : 'bg-white text-warm-400 border-warm-100'
                      }`}
                    >
                      Article {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* One word — primary article only */}
              {activeIdx === 0 && (
                <p className="font-serif text-5xl font-semibold text-warm-900 mb-3 leading-none">
                  {finding.oneWord}
                </p>
              )}

              {/* Title */}
              <p className="text-warm-800 text-base font-medium leading-snug mb-5">{currentTitle}</p>

              {/* Summary sections */}
              <div className="bg-white rounded-2xl p-4 mb-5 border border-warm-100">
                {activeIdx === 0 ? (
                  hasStructured ? (
                    SECTIONS.map(({ key, label }) => {
                      const val = finding[key];
                      if (!val) return null;
                      return (
                        <div key={key} className="mb-4 last:mb-0">
                          <p className="text-xs text-warm-400 uppercase tracking-wide mb-1.5">{label}</p>
                          <p className="text-warm-700 text-sm leading-7">{val}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-warm-700 text-sm leading-7">{finding.summary}</p>
                  )
                ) : (
                  <p className="text-warm-700 text-sm leading-7">
                    {finding.alternates![activeIdx - 1].desc || 'Tap "Full article" to read more.'}
                  </p>
                )}
              </div>

              {/* Source row */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <span className="text-xs text-warm-400">{currentSource}</span>
                {currentPubDate && <span className="text-xs text-warm-300">· {currentPubDate}</span>}
                {currentUrl && (
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-sage font-medium underline underline-offset-2 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    Full article ↗
                  </a>
                )}
              </div>

              {/* Actions — primary article only */}
              {activeIdx === 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-warm-100 pb-2">
                  <ReflectWithAI context={aiPrompt} label="Reflect with AI" />
                  <button
                    onClick={handleSaveInitiate}
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hub save prompt */}
      {showHubPrompt && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: 'rgba(61,53,48,0.4)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowHubPrompt(false)}>
          <div className="bg-cream rounded-t-4xl px-6 pt-6 pb-10"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-5" />
            <p className="font-serif text-xl text-warm-900 mb-1">What made this useful?</p>
            <p className="text-warm-500 text-xs mb-4 leading-snug line-clamp-2">"{finding.title}"</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {HUB_COLLECTIONS.map(c => (
                <button key={c.id} onClick={() => setHubCollection(c.id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl border text-left transition-all ${
                    hubCollection === c.id ? 'bg-white border-sage shadow-card' : 'bg-white border-warm-100'
                  }`}>
                  <span className="text-base">{c.icon}</span>
                  <span className="text-xs font-medium text-warm-700">{c.label}</span>
                </button>
              ))}
            </div>

            <textarea
              value={hubReason}
              onChange={e => setHubReason(e.target.value)}
              placeholder="Optional — what did this remind you of, or why does it matter right now?"
              rows={2}
              className="w-full bg-white border border-warm-100 rounded-2xl px-3 py-2.5 text-sm text-warm-800 placeholder-warm-300 resize-none focus:outline-none focus:border-sage mb-4"
            />

            <div className="flex gap-3">
              <button onClick={() => { setShowHubPrompt(false); handleSaveConfirm(); }}
                className="flex-1 py-3 rounded-2xl border border-warm-200 text-warm-500 text-sm">
                Skip — just save
              </button>
              <button onClick={handleSaveConfirm} disabled={!hubCollection}
                className="flex-1 py-3 rounded-2xl bg-sage text-white text-sm font-medium disabled:opacity-40">
                Save to Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
