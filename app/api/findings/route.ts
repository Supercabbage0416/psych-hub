import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { CATEGORIES, getCategoryById, type CategoryId } from '@/lib/articleCategories';

// Default categories when no check-in is available
const DEFAULT_CATEGORIES: CategoryId[] = ['behavioral_activation', 'stress_recovery', 'meaning_identity'];

// ── XML / RSS helpers ──────────────────────────────────────────────────────

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

function passesGate(
  title: string,
  desc: string,
  mustContain: string[],
  mustNotContain: string[]
): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  for (const term of mustNotContain) {
    if (text.includes(term.toLowerCase())) return false;
  }
  for (const term of mustContain) {
    if (text.includes(term.toLowerCase())) return true;
  }
  return false;
}

async function fetchCategoryItems(categoryId: CategoryId) {
  const category = getCategoryById(categoryId);
  const all: { title: string; desc: string; url: string; pubDate: string }[] = [];

  for (const rssUrl of category.sources) {
    try {
      const res = await fetch(rssUrl, {
        headers: { 'User-Agent': 'PsychHub/1.0 (personal wellbeing app)' },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const parsed = parser.parse(xml);
      const channel = parsed?.rss?.channel ?? parsed?.feed;
      const raw = channel?.item ?? channel?.entry ?? [];
      const items = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[];

      for (const item of items.slice(0, 20)) {
        const title = stripHtml(extractText(item.title));
        const desc = stripHtml(extractText(
          item.description ?? item.summary ?? item['content:encoded'] ?? ''
        )).slice(0, 2000);

        if (title.length < 10) continue;
        if (!passesGate(title, desc, category.mustContain, category.mustNotContain)) continue;

        all.push({
          title,
          desc,
          url: extractUrl(item),
          pubDate: extractText(item.pubDate ?? item.published ?? ''),
        });

        if (all.length >= 20) break;
      }

      if (all.length >= 15) break; // enough — stop fetching more sources
    } catch { continue; }
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

// GET /api/findings?categories=stress_recovery,behavioral_activation
// Returns: [{ categoryId, categoryLabel, items[] }]
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const param = searchParams.get('categories');

  const requestedIds: CategoryId[] = param
    ? (param.split(',').filter(id => CATEGORIES.some(c => c.id === id)) as CategoryId[])
    : DEFAULT_CATEGORIES;

  const categoryIds = requestedIds.length > 0 ? requestedIds : DEFAULT_CATEGORIES;

  // Deduplicate articles across categories — once a URL is used, exclude it from later categories
  const usedUrls = new Set<string>();
  const results: { categoryId: CategoryId; categoryLabel: string; categoryDescription: string; items: { title: string; desc: string; url: string; pubDate: string }[] }[] = [];

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
