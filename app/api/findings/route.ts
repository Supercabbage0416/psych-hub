import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// Each field has dedicated, non-overlapping RSS sources + keyword gates
// to block obviously off-topic articles before DeepSeek sees them.

const FIELDS = [
  {
    id: 'behavioral',
    field: 'Behavioral',
    // Sources: dedicated behavioral/cognitive science outlets
    urls: [
      'https://behavioralscientist.org/feed/',
      'https://bpsresearchdigest.com/feed/',
      'https://digest.bps.org.uk/feed/',
    ],
    // Must contain at least one of these in title/desc
    mustContain: ['habit', 'behav', 'cognit', 'decision', 'emotion', 'motivat', 'bias', 'mental', 'mind', 'psycholog', 'pattern', 'think', 'self'],
    // Reject if title contains any of these
    mustNotContain: ['alzheimer', 'cancer', 'tumor', 'disease', 'drug', 'surgery', 'vaccine', 'hospital', 'artificial intelligence', ' ai ', 'chatgpt', 'robot', 'machine learning', 'climate', 'election', 'stock'],
  },
  {
    id: 'io_work',
    field: 'I/O & Work',
    // Sources: dedicated workplace/organizational psychology outlets
    urls: [
      'https://www.ioatwork.com/feed/',
      'https://workdesignmagazine.com/feed/',
      'https://sloanreview.mit.edu/feed/',
      'https://hbr.org/feed',
    ],
    mustContain: ['team', 'leader', 'workplace', 'employ', 'organiz', 'manage', 'work', 'job', 'burnout', 'collabor', 'productiv', 'perform', 'culture', 'engag'],
    mustNotContain: ['alzheimer', 'cancer', 'tumor', 'vaccine', 'surgery', 'hospital', 'drug', 'artificial intelligence', ' ai model', 'chatgpt', 'climate', 'election', 'stock market'],
  },
  {
    id: 'group_social',
    field: 'Group & Social',
    // Sources: specifically social psychology RSS — NOT shared with behavioral
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://greatergood.berkeley.edu/feeds/news',
      'https://psycnet.apa.org/rss/journal/gd0',
    ],
    mustContain: ['social', 'group', 'community', 'relationship', 'belonging', 'conform', 'peer', 'connect', 'loneli', 'friend', 'trust', 'identity', 'norms', 'influenc', 'cooperat'],
    mustNotContain: ['alzheimer', 'cancer', 'tumor', 'vaccine', 'drug', 'surgery', 'hospital', 'artificial intelligence', 'machine learning', 'robot', 'climate change', 'election', 'stock'],
  },
  {
    id: 'stress_release',
    field: 'Stress & Recovery',
    // Sources: mindfulness/wellbeing specific — NOT sciencedaily general
    urls: [
      'https://www.mindful.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/stress.xml',
      'https://www.apa.org/rss/news.xml',
    ],
    mustContain: ['stress', 'sleep', 'mindful', 'meditat', 'recover', 'wellbeing', 'wellness', 'rest', 'breath', 'calm', 'relax', 'resilien', 'burnout', 'anxiety', 'self-care', 'cortisol'],
    mustNotContain: ['alzheimer', 'cancer', 'tumor', 'drug', 'surgery', 'hospital', 'vaccine', 'artificial intelligence', ' ai ', 'machine learning', 'robot', 'climate', 'election', 'stock'],
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

function passesGate(
  title: string,
  desc: string,
  mustContain: string[],
  mustNotContain: string[]
): boolean {
  const text = (title + ' ' + desc).toLowerCase();

  // Hard block on forbidden terms
  for (const term of mustNotContain) {
    if (text.includes(term.toLowerCase())) return false;
  }

  // Must match at least one relevant keyword
  for (const term of mustContain) {
    if (text.includes(term.toLowerCase())) return true;
  }

  return false;
}

async function fetchFieldItems(
  urls: string[],
  mustContain: string[],
  mustNotContain: string[]
) {
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

      for (const item of items.slice(0, 15)) {
        const title = stripHtml(extractText(item.title));
        const desc = stripHtml(extractText(
          item.description ?? item.summary ?? item['content:encoded'] ?? ''
        )).slice(0, 2000);

        if (title.length < 10) continue;
        if (!passesGate(title, desc, mustContain, mustNotContain)) continue;

        all.push({
          title,
          desc,
          url: extractUrl(item),
          pubDate: extractText(item.pubDate ?? item.published ?? ''),
        });
      }

      if (all.length >= 15) break;
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

export async function GET() {
  const results = await Promise.all(
    FIELDS.map(async (f) => ({
      field: f.field,
      id: f.id,
      items: await fetchFieldItems(f.urls, f.mustContain, f.mustNotContain),
    }))
  );

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
  });
}
