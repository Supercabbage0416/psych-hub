import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const FIELDS = [
  {
    field: 'Behavioral',
    keywords: ['behavior','habit','motivation','reward','learning','emotion','anxiety',
      'stress','decision','cognitive','memory','attention','mood','depression','therapy',
      'coping','fear','anger','mental','mindset','pattern','trigger','response','feeling'],
    urls: [
      'https://bpsresearchdigest.com/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',
      'https://feeds.apa.org/apa/releases',
    ],
  },
  {
    field: 'I/O & Work',
    keywords: ['work','workplace','team','leadership','organization','employee','burnout',
      'productivity','job','career','manager','colleague','performance','collaboration',
      'satisfaction','engagement','culture','office','meeting','deadline','feedback'],
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/educational_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',
    ],
  },
  {
    field: 'Group & Social',
    keywords: ['social','group','conformity','influence','peer','community','belonging',
      'identity','relationship','trust','cooperation','conflict','communication','culture',
      'norms','loneliness','connection','friendship','empathy','collective','crowd'],
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
    ],
  },
];

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','was','are','were','be','have','has','had','do','does','did',
  'will','would','could','should','may','might','can','how','why','what',
  'when','where','which','who','that','this','new','study','research',
  'shows','finds','found','reveals','suggests','scientists','researchers',
]);

function scoreArticle(title: string, description: string, keywords: string[]): number {
  const text = `${title} ${description}`.toLowerCase().replace(/[^a-z\s]/g, ' ');
  const words = text.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
  return keywords.filter(kw => words.includes(kw) || text.includes(kw)).length;
}

function extractUrl(item: Record<string, unknown>): string {
  // Try multiple RSS/Atom link formats
  if (typeof item.link === 'string' && item.link.startsWith('http')) return item.link;
  if (typeof item.link === 'object' && item.link !== null) {
    const l = item.link as Record<string, unknown>;
    if (typeof l['@_href'] === 'string') return l['@_href'];
    if (typeof l['#text'] === 'string') return l['#text'];
  }
  if (typeof item.guid === 'string' && item.guid.startsWith('http')) return item.guid;
  if (typeof item.guid === 'object' && item.guid !== null) {
    const g = item.guid as Record<string, unknown>;
    if (typeof g['#text'] === 'string' && (g['#text'] as string).startsWith('http')) return g['#text'] as string;
  }
  return '';
}

function extractText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const v = val as Record<string, unknown>;
    return (v['#text'] as string) ?? '';
  }
  return '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,'').trim();
}

function extractOneWord(title: string): string {
  const psychKeywords = [
    'resilience','attachment','motivation','bias','stress','anxiety','reward','habit',
    'memory','emotion','trauma','cognition','behavior','identity','trust','empathy',
    'autonomy','burnout','focus','decision','conflict','belonging','connection','growth',
    'safety','control','pattern','regulation','mindset','perception','attention',
    'learning','performance','wellbeing','purpose','creativity','influence','adaptation',
    'gratitude','compassion','awareness','pressure','recovery','loneliness','happiness',
    'confidence','engagement','satisfaction','conformity','cooperation','leadership',
  ];
  const lower = title.toLowerCase();
  for (const kw of psychKeywords) {
    if (lower.includes(kw)) return kw.charAt(0).toUpperCase() + kw.slice(1);
  }
  const words = title.split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length > 4 && !STOP_WORDS.has(w.toLowerCase()));
  return words.length > 0
    ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
    : 'Insight';
}

async function fetchItems(url: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PsychHub/1.0 (personal learning app)' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed;
    const items = channel?.item ?? channel?.entry ?? [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

async function getBestArticle(fieldConfig: typeof FIELDS[0]) {
  const allItems: Record<string, unknown>[] = [];

  for (const url of fieldConfig.urls) {
    const items = await fetchItems(url);
    allItems.push(...items.slice(0, 15));
    if (allItems.length >= 20) break;
  }

  if (allItems.length === 0) return null;

  // Score each article against field keywords
  const scored = allItems.map(item => {
    const title = stripHtml(extractText(item.title));
    const desc = stripHtml(extractText(item.description ?? item.summary ?? item['content:encoded'] ?? ''));
    const score = scoreArticle(title, desc, fieldConfig.keywords);
    return { item, title, desc, score };
  });

  // Sort by relevance, then rotate by day to get variety
  const relevant = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  const pool = relevant.length > 0 ? relevant : scored;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const pick = pool[dayOfYear % pool.length];

  const url = extractUrl(pick.item);
  const pubDate = extractText(pick.item.pubDate ?? pick.item.published ?? '');
  const source = (() => {
    try { return new URL(fieldConfig.urls[0]).hostname.replace('www.', ''); }
    catch { return 'Psychology Research'; }
  })();

  return {
    field: fieldConfig.field,
    title: pick.title || 'Psychology finding',
    summary: pick.desc.slice(0, 280) || '',
    source,
    url,
    oneWord: extractOneWord(pick.title),
    pubDate: pubDate ? (() => { try { return new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } })() : '',
  };
}

const FALLBACKS = [
  {
    field: 'Behavioral',
    title: 'Habits form through consistent context cues, not willpower alone',
    summary: 'Environment design is more powerful than motivation for building lasting habits. The context around us shapes our automatic responses more than conscious effort.',
    source: 'European Journal of Social Psychology',
    url: 'https://www.apa.org/topics/behavioral-health',
    oneWord: 'Habit',
    pubDate: '',
  },
  {
    field: 'I/O & Work',
    title: 'Psychological safety at work predicts team innovation and error reporting',
    summary: 'Teams where members feel safe to speak up without fear show higher performance, creativity, and willingness to flag problems early.',
    source: 'Journal of Applied Psychology',
    url: 'https://www.apa.org/topics/work-stress',
    oneWord: 'Safety',
    pubDate: '',
  },
  {
    field: 'Group & Social',
    title: 'Social conformity pressure activates threat-detection regions of the brain',
    summary: 'Disagreeing with group consensus triggers the same neural pathways as physical threat perception, explaining why speaking up feels genuinely dangerous.',
    source: 'Biological Psychiatry',
    url: 'https://www.apa.org/topics/social-connections',
    oneWord: 'Conformity',
    pubDate: '',
  },
];

export async function GET() {
  const results = await Promise.all(FIELDS.map(getBestArticle));
  const findings = results.map((r, i) => r ?? FALLBACKS[i]);

  return NextResponse.json(findings, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
