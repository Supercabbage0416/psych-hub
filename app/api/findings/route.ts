import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { CATEGORIES, getCategoryById, type CategoryId } from '@/lib/articleCategories';

const DEFAULT_CATEGORIES: CategoryId[] = ['behavioral_activation', 'stress_recovery', 'meaning_identity'];

// Google News RSS search query per category — fresh results every day
const GOOGLE_NEWS_QUERIES: Record<CategoryId, string> = {
  behavioral_activation:   'psychology habits motivation behavioral activation small steps',
  stress_recovery:         'stress recovery cortisol nervous system mindfulness psychology research',
  social_anxiety:          'social anxiety psychology fear judgment research study',
  shame_embarrassment:     'shame embarrassment psychology self-compassion research',
  self_worth:              'self-esteem self-compassion self-worth psychology research',
  meaning_identity:        'meaning purpose identity psychology wellbeing research',
  autonomy_uncertainty:    'autonomy uncertainty control psychology decision making research',
  relationship_belonging:  'belonging loneliness connection social support psychology research',
  burnout_recovery:        'burnout recovery exhaustion workplace psychology research',
  emotional_regulation:    'emotional regulation coping psychology research study',
};

function googleNewsUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

// ── XML / RSS helpers ────────────────────────────────────────────────────────

function extractText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null)
    return ((val as Record<string, unknown>)['#text'] as string) ?? '';
  return '';
}

function extractUrl(item: Record<string, unknown>): string {
  if (typeof item.link === 'string' && item.link.startsWith('http')) return item.link;
  if (typeof item.link === 'object' && item.link !== null) {
    const l = item.link as Record<string, unknown>;
    if (typeof l['@_href'] === 'string') return l['@_href'];
    if (typeof l['#text'] === 'string') return l['#text'];
  }
  if (typeof item.guid === 'string' && item.guid.startsWith('http')) return item.guid;
  if (typeof item.guid === 'object' && item.guid !== null) {
    const g = (item.guid as Record<string, unknown>)['#text'];
    if (typeof g === 'string' && g.startsWith('http')) return g;
  }
  return '';
}

function stripHtml(html: string): string {
  return (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
}

function passesGate(title: string, desc: string, mustContain: string[], mustNotContain: string[]): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  for (const term of mustNotContain) {
    if (text.includes(term.toLowerCase())) return false;
  }
  for (const term of mustContain) {
    if (text.includes(term.toLowerCase())) return true;
  }
  return false;
}

type RawItem = { title: string; desc: string; url: string; pubDate: string };

async function fetchRss(url: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PsychHub/1.0 (personal wellbeing app)' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel ?? parsed?.feed;
  const raw = channel?.item ?? channel?.entry ?? [];
  return (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];
}

async function fetchCategoryItems(categoryId: CategoryId): Promise<RawItem[]> {
  const category = getCategoryById(categoryId);
  const all: RawItem[] = [];

  // ── Primary: Google News (fresh daily results) ───────────────────────────
  try {
    const gnUrl = googleNewsUrl(GOOGLE_NEWS_QUERIES[categoryId]);
    const items = await fetchRss(gnUrl);

    for (const item of items.slice(0, 25)) {
      const title = stripHtml(extractText(item.title));
      const desc  = stripHtml(extractText(item.description ?? item.summary ?? '')).slice(0, 1500);

      if (title.length < 15) continue;
      if (!passesGate(title, desc, category.mustContain, category.mustNotContain)) continue;

      all.push({ title, desc, url: extractUrl(item), pubDate: extractText(item.pubDate ?? item.published ?? '') });
      if (all.length >= 12) break;
    }
  } catch { /* fall through to fixed sources */ }

  // ── Fallback: fixed RSS feeds if Google News gave too few results ─────────
  if (all.length < 5) {
    for (const rssUrl of category.sources) {
      try {
        const items = await fetchRss(rssUrl);
        for (const item of items.slice(0, 20)) {
          const title = stripHtml(extractText(item.title));
          const desc  = stripHtml(extractText(item.description ?? item.summary ?? item['content:encoded'] ?? '')).slice(0, 1500);

          if (title.length < 10) continue;
          if (!passesGate(title, desc, category.mustContain, category.mustNotContain)) continue;

          all.push({ title, desc, url: extractUrl(item), pubDate: extractText(item.pubDate ?? item.published ?? '') });
          if (all.length >= 15) break;
        }
        if (all.length >= 15) break;
      } catch { continue; }
    }
  }

  // Deduplicate by title prefix
  const seen = new Set<string>();
  return all.filter(i => {
    const key = i.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

// POST /api/findings — body: { mood, categories: CategoryId[] }
// Returns { articles: [{ title, url, source }] } for the client cache
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const categoryIds: CategoryId[] = Array.isArray(body.categories)
    ? (body.categories.filter((id: string) => CATEGORIES.some(c => c.id === id)) as CategoryId[])
    : DEFAULT_CATEGORIES;

  const ids = categoryIds.length > 0 ? categoryIds : DEFAULT_CATEGORIES;
  const usedUrls = new Set<string>();
  const articles: { title: string; url: string; source: string }[] = [];

  for (const id of ids) {
    const items = await fetchCategoryItems(id);
    for (const item of items) {
      if (!item.url || usedUrls.has(item.url)) continue;
      usedUrls.add(item.url);
      // Extract domain as source if no source provided
      let source = '';
      try { source = new URL(item.url).hostname.replace('www.', ''); } catch { /* ignore */ }
      articles.push({ title: item.title, url: item.url, source });
      if (articles.length >= 10) break;
    }
    if (articles.length >= 10) break;
  }

  return NextResponse.json({ articles }, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}

// GET /api/findings?categories=stress_recovery,behavioral_activation
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const param = searchParams.get('categories');

  const requestedIds: CategoryId[] = param
    ? (param.split(',').filter(id => CATEGORIES.some(c => c.id === id)) as CategoryId[])
    : DEFAULT_CATEGORIES;

  const categoryIds = requestedIds.length > 0 ? requestedIds : DEFAULT_CATEGORIES;

  // Deduplicate articles across categories
  const usedUrls = new Set<string>();
  const results = [];

  for (const id of categoryIds) {
    const category = getCategoryById(id);
    const items = await fetchCategoryItems(id);
    const deduped = items.filter(item => {
      if (!item.url || usedUrls.has(item.url)) return false;
      usedUrls.add(item.url);
      return true;
    });
    results.push({
      categoryId: id,
      categoryLabel: category.label,
      categoryDescription: category.description,
      items: deduped,
    });
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
