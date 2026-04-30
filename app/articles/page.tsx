'use client';

import { useEffect, useState } from 'react';
import { getUserArticles, deleteUserArticle, saveHubItem } from '@/lib/supabase';
import ArticleForm from '@/components/ArticleForm';

interface Article {
  id: string; title: string; content: string; source: string; url: string;
  category_id: string; category_name: string; summary: string; sentiment: string;
  created_at: string;
}

const categoryBadge: Record<string, string> = {
  behavioral: 'bg-sage-pale text-sage',
  io_work: 'bg-rose-pale text-rose',
  wellbeing: 'bg-amber-50 text-amber-700',
};

const sentimentIcon: Record<string, string> = {
  calm: '🌿', anxious: '🌫️', heavy: '🌫️', mixed: '☁️', reflective: '💭',
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const load = () => {
    getUserArticles().then((data) => { setArticles(data as Article[]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filters = [...new Set(articles.map((a) => a.category_id).filter(Boolean))];
  const filtered = activeFilter ? articles.filter((a) => a.category_id === activeFilter) : articles;

  const handleSaveToHub = async (article: Article) => {
    await saveHubItem({
      type: 'article', title: article.title, content: article.summary,
      source: article.source, url: article.url, field: article.category_name,
      tags: [article.category_id, article.sentiment].filter(Boolean),
    });
  };

  return (
    <div className="px-5 pt-8 animate-fade-in">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-warm-400 text-xs uppercase tracking-wide mb-1">Your reading</p>
          <h1 className="font-serif text-3xl text-warm-900">Articles</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-sage text-white text-sm px-4 py-2 rounded-full font-medium active:scale-95 transition-transform">
          + Add
        </button>
      </div>

      {/* Category filter */}
      {filters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button onClick={() => setActiveFilter(null)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
              !activeFilter ? 'bg-sage text-white border-sage' : 'bg-white text-warm-500 border-warm-100'}`}>
            All
          </button>
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f === activeFilter ? null : f)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium border transition-colors ${
                activeFilter === f ? 'bg-sage text-white border-sage' : `${categoryBadge[f] ?? 'bg-white text-warm-500'} border-transparent`}`}>
              {articles.find((a) => a.category_id === f)?.category_name ?? f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-2xl text-warm-300 mb-2">No articles yet</p>
          <p className="text-warm-400 text-sm">Tap + Add to save your first one</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <div key={article.id} className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryBadge[article.category_id] ?? 'bg-warm-100 text-warm-500'}`}>
                  {article.category_name}
                </span>
                <div className="flex items-center gap-2">
                  {article.sentiment && (
                    <span className="text-sm">{sentimentIcon[article.sentiment] ?? '·'}</span>
                  )}
                  <button onClick={() => handleSaveToHub(article)}
                    className="text-warm-300 hover:text-rose transition-colors" title="Save to Hub">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button onClick={async () => { await deleteUserArticle(article.id); load(); }}
                    className="text-warm-300 hover:text-red-400 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="font-medium text-warm-800 text-sm mb-2 leading-snug">{article.title}</h3>
              {article.summary && (
                <p className="text-warm-500 text-xs leading-relaxed mb-3 line-clamp-3">{article.summary}</p>
              )}

              <div className="flex items-center gap-2">
                {article.source && <span className="text-xs text-warm-300">{article.source}</span>}
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sage underline underline-offset-2">Read full</a>
                )}
                <span className="text-xs text-warm-200 ml-auto">
                  {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ArticleForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
