import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const RSS_SOURCES = [
  {
    field: 'Behavioral',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',
      'https://feeds.apa.org/apa/releases',
    ],
  },
  {
    field: 'I/O & Work',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/educational_psychology.xml',
      'https://www.psychologytoday.com/us/feed/rss',
    ],
  },
  {
    field: 'Group & Social',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
    ],
  },
];

const PSYCH_KEYWORDS = [
  'resilience', 'attachment', 'motivation', 'bias', 'stress', 'anxiety',
  'reward', 'habit', 'memory', 'emotion', 'trauma', 'cognition', 'behavior',
  'identity', 'trust', 'empathy', 'autonomy', 'burnout', 'focus', 'decision',
  'conflict', 'belonging', 'connection', 'growth', 'safety', 'control',
  'pattern', 'trigger', 'regulation', 'mindset', 'perception', 'attention',
  'learning', 'performance', 'wellbeing', 'purpose', 'creativity', 'influence',
  'adaptation', 'gratitude', 'compassion', 'awareness', 'pressure', 'recovery',
  'leadership', 'cooperation', 'conformity', 'loneliness', 'happiness', 'fear',
  'confidence', 'self-esteem', 'withdrawal', 'engagement', 'satisfaction',
];

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might','can',
  'how','why','what','when','where','which','who','that','this','these','those',
  'new','study','research','shows','finds','found','reveals','suggests','may',
  'help','make','use','using','used','more','less','than','its','their','your',
  'our','not','also','can','two','one','three','first','second','people',
]);

function extractOneWord(title: string): string {
  const lower = title.toLowerCase();
  for (const kw of PSYCH_KEYWORDS) {
    if (lower.includes(kw)) {
      return kw.charAt(0).toUpperCase() + kw.slice(1);
    }
  }
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w.toLowerCase()));
  if (words.length > 0) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }
  return 'Insight';
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() ?? '';
}

async function fetchRSS(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PsychHub/1.0' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  return parser.parse(xml);
}

async function getOneArticle(field: string, urls: string[]) {
  for (const url of urls) {
    try {
      const parsed = await fetchRSS(url);
      const channel = parsed?.rss?.channel ?? parsed?.feed;
      const items: Record<string, string>[] = channel?.item ?? channel?.entry ?? [];
      if (!items.length) continue;

      // Pick today's item by rotating on day of year
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      const item = items[dayOfYear % items.length];
      const title = stripHtml(
        typeof item.title === 'object' ? (item.title as Record<string, string>)['#text'] ?? '' : item.title ?? ''
      );
      const summary = stripHtml(
        item.description ?? item.summary ?? item['content:encoded'] ?? ''
      ).slice(0, 200);
      const link = item.link ?? item.guid ?? url;
      const pubDate = item.pubDate ?? item.published ?? '';

      return {
        field,
        title: title || 'Psychology finding',
        summary,
        source: new URL(url).hostname.replace('www.', ''),
        url: typeof link === 'object' ? (link as Record<string, string>)['@_href'] ?? url : link,
        oneWord: extractOneWord(title),
        pubDate: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      };
    } catch {
      continue;
    }
  }
  return null;
}

// Fallback findings if RSS is unavailable
const FALLBACKS = [
  {
    field: 'Behavioral',
    title: 'Habits form through consistent context cues, not willpower alone',
    summary: 'Research shows that environment design is more powerful than motivation for building lasting habits.',
    source: 'European Journal of Social Psychology',
    url: 'https://www.apa.org',
    oneWord: 'Habit',
    pubDate: '',
  },
  {
    field: 'I/O & Work',
    title: 'Psychological safety at work predicts team innovation and error reporting',
    summary: 'Teams where members feel safe to speak up without fear show higher performance and creativity.',
    source: 'Journal of Applied Psychology',
    url: 'https://www.apa.org',
    oneWord: 'Safety',
    pubDate: '',
  },
  {
    field: 'Group & Social',
    title: 'Social conformity pressure activates threat-detection regions of the brain',
    summary: 'Disagreeing with group consensus triggers the same neural pathways as physical threat perception.',
    source: 'Biological Psychiatry',
    url: 'https://www.sciencedirect.com',
    oneWord: 'Conformity',
    pubDate: '',
  },
];

export async function GET() {
  const results = await Promise.all(
    RSS_SOURCES.map((s) => getOneArticle(s.field, s.urls))
  );

  const findings = results.map((r, i) => r ?? FALLBACKS[i]);

  return NextResponse.json(findings, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
