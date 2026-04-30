'use client';

import { useEffect, useState } from 'react';
import { getHubItems, deleteHubItem } from '@/lib/supabase';

interface HubItem {
  id: string; type: string; title: string; content: string;
  source: string; url: string; field: string; tags: string[];
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  finding: { label: 'Finding', icon: '🔬', color: 'bg-sage-pale text-sage' },
  article: { label: 'Article', icon: '📄', color: 'bg-rose-pale text-rose' },
  note: { label: 'Note', icon: '✏️', color: 'bg-amber-50 text-amber-700' },
};

export default function HubPage() {
  const [items, setItems] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  const load = () => {
    getHubItems().then((data) => { setItems(data as HubItem[]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const types = Array.from(new Set(items.map((i) => i.type)));

  const filtered = items.filter((item) => {
    const matchType = !activeType || item.type === activeType;
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return;
    const { saveHubItem } = await import('@/lib/supabase');
    await saveHubItem({ type: 'note', title: noteTitle.trim(), content: noteText.trim() });
    setNoteTitle(''); setNoteText(''); setShowNoteForm(false); load();
  };

  return (
    <div className="px-5 pt-8 animate-fade-in">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your collection</p>
          <h1 className="font-serif text-3xl text-warm-900">My Hub</h1>
        </div>
        <button onClick={() => setShowNoteForm(!showNoteForm)}
          className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform">
          + Note
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your library..."
          className="w-full bg-white rounded-2xl pl-9 pr-4 py-3 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage transition-colors placeholder:text-warm-300" />
      </div>

      {/* Add note form */}
      {showNoteForm && (
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100 mb-4">
          <p className="text-xs text-warm-400 mb-3">Capture a thought or idea</p>
          <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Title or headline"
            className="w-full bg-cream rounded-xl px-3 py-2.5 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage mb-2 placeholder:text-warm-300" />
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
            placeholder="Your idea, quote, or observation..."
            rows={3}
            className="w-full bg-cream rounded-xl px-3 py-2.5 text-warm-800 text-sm border border-warm-100 focus:outline-none focus:border-sage resize-none placeholder:text-warm-300 mb-3" />
          <div className="flex gap-2">
            <button onClick={() => setShowNoteForm(false)}
              className="flex-1 py-2.5 border border-warm-200 text-warm-600 rounded-xl text-sm">Cancel</button>
            <button onClick={handleSaveNote} disabled={!noteTitle.trim()}
              className="flex-1 py-2.5 bg-sage text-white rounded-xl text-sm font-medium disabled:opacity-40">Save note</button>
          </div>
        </div>
      )}

      {/* Type filter */}
      {types.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button onClick={() => setActiveType(null)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${!activeType ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'}`}>
            All ({items.length})
          </button>
          {types.map((t) => (
            <button key={t} onClick={() => setActiveType(t === activeType ? null : t)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeType === t ? 'bg-sage text-white border-sage' : `${typeConfig[t]?.color ?? 'bg-white text-warm-500'} border-transparent`}`}>
              {typeConfig[t]?.icon} {typeConfig[t]?.label ?? t} ({items.filter((i) => i.type === t).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-warm-300 mb-2">Your hub is empty</p>
          <p className="text-warm-400 text-sm">Save findings, articles, or add your own notes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const config = typeConfig[item.type] ?? typeConfig.note;
            return (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
                    {config.icon} {config.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-warm-300">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={async () => { await deleteHubItem(item.id); load(); }}
                      className="text-warm-200 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="font-medium text-warm-800 text-sm mb-1.5 leading-snug">{item.title}</h3>
                {item.content && (
                  <p className="text-warm-500 text-xs leading-relaxed line-clamp-3">{item.content}</p>
                )}
                {item.field && (
                  <p className="text-xs text-warm-300 mt-2">{item.field}</p>
                )}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-warm-100 text-warm-500 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sage underline underline-offset-2 mt-2 block">Read original</a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
