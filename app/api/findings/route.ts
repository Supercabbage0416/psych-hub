import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Returns raw RSS items per field — DeepSeek selection happens client-side
// to avoid Vercel's 10-second serverless function timeout

const FIELDS = [
  {
    id: 'behavioral',
    field: 'Behavioral',
    urls: [
      'https://bpsresearchdigest.com/feed/',
      'https://behavioralscientist.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',
    ],
  },
  {
    id: 'io_work',
    field: 'I/O & Work',
    urls: [
      'https://www.ioatwork.com/feed/',
      'https://workdesignmagazine.com/feed/',
      'https://sloanreview.mit.edu/feed/',
      'https://hbr.org/feed',
      'https://www.sciencedaily.com/rss/mind_brain/educational_psychology.xml',
    ],
  },
  {
    id: 'group_social',
    field: 'Group & Social',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://behavioralscientist.org/feed/',
    ],
  },
  {
    id: 'stress_release',
    field: 'Stress & Recovery',
    urls: [
      'https://greatergood.berkeley.edu/feeds/news',
      'https://www.mindful.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/stress.xml',
    ],
  },
];

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

async function fetchFieldItems(urls: string[]) {
  const all: { title: string; desc: string; url: string; pubDate: string }[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PsychHub/1.0' },
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

      for (const item of items.slice(0, 10)) {
        const title = stripHtml(extractText(item.title));
        const desc = stripHtml(extractText(
          item.description ?? item.summary ?? item['content:encoded'] ?? ''
        )).slice(0, 500);
        if (title.length > 10) {
          all.push({ title, desc, url: extractUrl(item), pubDate: extractText(item.pubDate ?? item.published ?? '') });
        }
      }
      if (all.length >= 15) break;
    } catch { continue; }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return all.filter(i => {
    const key = i.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 12);
}

export async function GET() {
  const results = await Promise.all(
    FIELDS.map(async (f) => ({
      field: f.field,
      id: f.id,
      items: await fetchFieldItems(f.urls),
    }))
  );

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
