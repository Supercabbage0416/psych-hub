'use client';

import { useState } from 'react';
import { categorizeArticle, extractiveSummarize, analyzeSentiment } from '@/lib/nlp';
import { summarizeWithAI, AI_STATUS_MESSAGES } from '@/lib/ai';
import { saveUserArticle } from '@/lib/supabase';

const categoryColors: Record<string, string> = {
  behavioral: 'bg-sage-pale text-sage border-sage-light',
  io_work: 'bg-rose-pale text-rose border-rose-light',
  wellbeing: 'bg-amber-50 text-amber-700 border-amber-200',
};

interface Props { onSaved?: () => void; onClose?: () => void; }

export default function ArticleForm({ onSaved, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<{
    category: ReturnType<typeof categorizeArticle>;
    summary: string;
    sentiment: ReturnType<typeof analyzeSentiment>;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim()) return;
    setAnalyzing(true);
    const category = categorizeArticle(title, content);
    const sentiment = analyzeSentiment(content || title);
    let summary = extractiveSummarize(content || title);
    const { summary: aiSummary, status } = await summarizeWithAI(title, content || title);
    if (aiSummary) summary = aiSummary;
    const notice = AI_STATUS_MESSAGES[status];
    if (notice) { setAiNotice(notice); setTimeout(() => setAiNotice(null), 6000); }
    setPreview({ category, summary, sentiment });
    setAnalyzing(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !preview) return;
    setSaving(true);
    await saveUserArticle({
      title: title.trim(),
      content: content.trim(),
      source: source.trim(),
      url: url.trim(),
      category_id: preview.category.id,
      category_name: preview.category.name,
      summary: preview.summary,
      sentiment: preview.sentiment.label,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSaved?.(); onClose?.(); }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(10,18,32,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-cream rounded-t-4xl px-6 pt-6 max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>

        <div className="w-10 h-1 bg-warm-300 rounded-full mx-auto mb-5" />

        {/* AI status toast */}
        {aiNotice && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 leading-relaxed animate-fade-in">
            ⚠️ {aiNotice}
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-warm-900">Add article</h2>
          {onClose && (
            <button onClick={onClose} className="text-warm-400 hover:text-warm-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title *"
            className="w-full bg-white rounded-2xl px-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Paste article text or key ideas (optional but improves analysis)"
            rows={4}
            className="w-full bg-white rounded-2xl px-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300 resize-none" />
          <div className="flex gap-2">
            <input value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. APA)"
              className="flex-1 bg-white rounded-2xl px-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300" />
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (optional)"
              className="flex-1 bg-white rounded-2xl px-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300" />
          </div>
        </div>

        {!preview ? (
          <button onClick={handleAnalyze} disabled={!title.trim() || analyzing}
            className="w-full py-3 bg-sage text-white rounded-2xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-40">
            {analyzing ? 'Analyzing...' : 'Analyse & categorise'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`rounded-2xl p-4 border ${categoryColors[preview.category.id] ?? categoryColors.wellbeing}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide">{preview.category.name}</span>
                <span className="text-xs opacity-60">{preview.category.confidence}% match</span>
              </div>
              <p className="text-sm leading-relaxed">{preview.summary}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs opacity-60">Tone:</span>
                <span className="text-xs font-medium capitalize">{preview.sentiment.label}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPreview(null)}
                className="flex-1 py-3 border border-warm-200 text-warm-600 rounded-2xl text-sm font-medium">
                Edit
              </button>
              <button onClick={handleSave} disabled={saving || saved}
                className="flex-1 py-3 bg-sage text-white rounded-2xl text-sm font-medium active:scale-95 transition-transform disabled:opacity-40">
                {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save to library'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
