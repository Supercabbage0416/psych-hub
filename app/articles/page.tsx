'use client';

import { useEffect, useState } from 'react';
import { getHubItems, deleteHubItem } from '@/lib/supabase';

interface HubItem {
  id: string; type: string; title: string; content: string;
  source: string; url: string; field: string; tags: string[];
  created_at: string;
}

const fieldBadge: Record<string, string> = {
  'Behavioral':        'bg-sage-pale text-sage',
  'I/O & Work':        'bg-rose-pale text-rose',
  'Group & Social':    'bg-amber-50 text-amber-700',
  'Stress & Recovery': 'bg-blue-50 text-blue-600',
};

export default function ArticlesPage() {
  const [items, setItems] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);

  const load = () => {
    getHubItems().then(data => {
      const findings = (data as HubItem[]).filter(i => i.type === 'finding');
      setItems(findings);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const fields = Array.from(new Set(items.map(i => i.field).filter(Boolean)));
  const filtered = activeField ? items.filter(i => i.field === activeField) : items;

  return (
    <div className="px-5 pt-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">What you've saved</p>
        <h1 className="font-serif text-3xl text-warm-900">Saved Findings</h1>
        <p className="text-warm-400 text-xs mt-1">Articles you've bookmarked from Today's findings</p>
      </div>

      {/* Field filter */}
      {fields.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button onClick={() => setActiveField(null)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${!activeField ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'}`}>
            All ({items.length})
          </button>
          {fields.map(f => (
            <button key={f} onClick={() => setActiveField(f === activeField ? null : f)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeField === f ? 'bg-sage text-white border-sage' : `${fieldBadge[f] ?? 'bg-white text-warm-500'} border-transparent`
              }`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-2xl text-warm-300 mb-2">Nothing saved yet</p>
          <p className="text-warm-400 text-sm leading-relaxed">
            Open a finding on the Today tab,<br />tap a card, then "Save to Hub"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <div className="flex items-start justify-between mb-2">
                {item.field && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${fieldBadge[item.field] ?? 'bg-warm-100 text-warm-500'}`}>
                    {item.field}
                  </span>
                )}
                <button onClick={async () => { await deleteHubItem(item.id); load(); }}
                  className="text-warm-200 hover:text-red-400 transition-colors ml-auto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>

              <p className="font-medium text-warm-800 text-sm mb-2 leading-snug">{item.title}</p>
              {item.content && (
                <p className="text-warm-500 text-xs leading-relaxed mb-3">{item.content}</p>
              )}
              <div className="flex items-center gap-2">
                {item.source && <span className="text-xs text-warm-300">{item.source}</span>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sage underline underline-offset-2 ml-auto">
                    Read full ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
