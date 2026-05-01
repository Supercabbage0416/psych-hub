import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// ── Curated stable sources per field ─────────────────────────────────────────

const FIELDS = [
  {
    id: 'behavioral',
    field: 'Behavioral',
    description: 'Behavioral psychology, habits, emotions, cognitive patterns, motivation, decision-making, mental health',
    urls: [
      'https://bpsresearchdigest.com/feed/',
      'https://behavioralscientist.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/psychology.xml',
    ],
  },
  {
    id: 'io_work',
    field: 'I/O & Work',
    description: 'Workplace psychology, organizational behavior, leadership, team dynamics, employee wellbeing, job performance, burnout at work',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/educational_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://hbr.org/feed',
    ],
  },
  {
    id: 'group_social',
    field: 'Group & Social',
    description: 'Social psychology, group dynamics, conformity, peer influence, belonging, relationships, communication, social identity',
    urls: [
      'https://www.sciencedaily.com/rss/mind_brain/social_psychology.xml',
      'https://bpsresearchdigest.com/feed/',
      'https://behavioralscientist.org/feed/',
    ],
  },
  {
    id: 'stress_release',
    field: 'Stress & Recovery',
    description: 'Stress management, recovery techniques, mindfulness, sleep, breathing, relaxation, resilience, mental rest, emotional regulation',
    urls: [
      'https://greatergood.berkeley.edu/feeds/news',
      'https://www.mindful.org/feed/',
      'https://www.sciencedaily.com/rss/mind_brain/stress.xml',
    ],
  },
];

// ── RSS utilities ─────────────────────────────────────────────────────────────

function extractText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    return ((val as Record<string, unknown>)['#text'] as string) ?? '';
  }
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
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchItems(url: string): Promise<{ title: string; desc: string; url: string; pubDate: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PsychHub/1.0' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel ?? parsed?.feed;
    const raw = channel?.item ?? channel?.entry ?? [];
    const items = Array.isArray(raw) ? raw : [raw];

    return items.slice(0, 12).map((item: Record<string, unknown>) => ({
      title: stripHtml(extractText(item.title)),
      desc: stripHtml(extractText(
        item.description ?? item.summary ?? item['content:encoded'] ?? ''
      )).slice(0, 400),
      url: extractUrl(item),
      pubDate: extractText(item.pubDate ?? item.published ?? ''),
    })).filter(i => i.title.length > 5);
  } catch {
    return [];
  }
}

// ── DeepSeek gatekeeper ───────────────────────────────────────────────────────

async function deepseekSelectAndSummarize(
  fieldName: string,
  fieldDescription: string,
  articles: { title: string; desc: string }[]
): Promise<{ index: number; summary: string; oneWord: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
  if (!apiKey || articles.length === 0) return null;

  const articleList = articles
    .map((a, i) => `${i + 1}. "${a.title}"\n   ${a.desc}`)
    .join('\n\n');

  const prompt = `You are curating daily psychology content for someone who wants to be more self-aware, reduce stress, and understand human behavior.

Field: ${fieldName}
What belongs here: ${fieldDescription}

From the articles below, select the ONE most relevant, insightful, and recent article for this field. It must genuinely belong to this field — reject anything off-topic.

Then write a clear, warm, 4-5 sentence summary that:
- Explains the core finding
- Makes it feel relevant to everyday life
- Uses plain language, no jargon
- Ends with one practical takeaway

Also choose a single powerful word (noun or verb) that captures the essence.

Articles:
${articleList}

Respond ONLY in valid JSON (no markdown):
{"index": 1, "summary": "...", "oneWord": "..."}`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const json = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Fallbacks ─────────────────────────────────────────────────────────────────

const FALLBACKS = [
  {
    field: 'Behavioral',
    title: 'Habits form through consistent context cues, not willpower alone',
    summary: 'Research consistently shows that environment design is more powerful than motivation for building lasting habits. When we change our surroundings, we change our automatic responses without relying on conscious effort. The brain links behaviors to contexts — the same cue in the same environment will reliably trigger the same response over time. This means the most effective habit change comes from redesigning your environment, not trying harder. One practical step: place what you want to do where you will naturally see it.',
    source: 'European Journal of Social Psychology',
    url: 'https://www.apa.org/topics/behavioral-health',
    oneWord: 'Habit',
    pubDate: '',
  },
  {
    field: 'I/O & Work',
    title: 'Psychological safety at work predicts team innovation and error reporting',
    summary: 'Teams where members feel safe to speak up without fear of judgment show significantly higher performance, creativity, and willingness to flag problems before they escalate. Psychological safety is not about being nice — it is about creating conditions where honest input is welcomed. Leaders who respond to bad news with curiosity rather than blame build cultures of learning. When people feel safe, they take the interpersonal risks that drive real collaboration. The simplest thing a team can do: make it easy to say "I don\'t know."',
    source: 'Journal of Applied Psychology',
    url: 'https://www.apa.org/topics/work-stress',
    oneWord: 'Safety',
    pubDate: '',
  },
  {
    field: 'Group & Social',
    title: 'Social conformity pressure activates threat-detection regions of the brain',
    summary: 'Disagreeing with group consensus triggers the same neural pathways as physical threat perception, which explains why speaking up in a group can feel genuinely dangerous even when there is no real risk. This response is ancient and automatic — the brain treats social rejection as a survival threat. It also means that the discomfort of going against the group is not weakness; it is biology. Understanding this can help us notice when we are self-silencing not from choice but from fear. The insight: your hesitation to speak up is normal, not a character flaw.',
    source: 'Biological Psychiatry',
    url: 'https://www.apa.org/topics/social-connections',
    oneWord: 'Conformity',
    pubDate: '',
  },
  {
    field: 'Stress & Recovery',
    title: 'Short periods of deliberate rest reduce cortisol more effectively than distraction',
    summary: 'Studies on stress recovery show that deliberate rest — doing nothing with intention — lowers cortisol levels more reliably than distracting yourself with screens or entertainment. The brain needs genuine downtime to consolidate experiences and restore cognitive resources. Distraction delays recovery; stillness accelerates it. Even 10 minutes of sitting quietly, without agenda, produces measurable physiological change. The practical implication: rest is not a reward for finishing — it is part of how the brain and body actually recover.',
    source: 'Journal of Experimental Psychology',
    url: 'https://greatergood.berkeley.edu',
    oneWord: 'Rest',
    pubDate: '',
  },
];

// ── Main handler ──────────────────────────────────────────────────────────────

async function getFieldFinding(fieldConfig: typeof FIELDS[0]) {
  // Fetch from all sources
  const allItems: { title: string; desc: string; url: string; pubDate: string }[] = [];
  for (const url of fieldConfig.urls) {
    const items = await fetchItems(url);
    allItems.push(...items);
    if (allItems.length >= 20) break;
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = allItems.filter(i => {
    const key = i.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // DeepSeek selects best + summarizes
  const ai = await deepseekSelectAndSummarize(
    fieldConfig.field,
    fieldConfig.description,
    unique.slice(0, 12)
  );

  if (ai && unique[ai.index - 1]) {
    const picked = unique[ai.index - 1];
    const source = (() => {
      try { return new URL(picked.url || fieldConfig.urls[0]).hostname.replace('www.', ''); }
      catch { return 'Psychology Research'; }
    })();
    const pubDate = picked.pubDate ? (() => {
      try { return new Date(picked.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
      catch { return ''; }
    })() : '';

    return {
      field: fieldConfig.field,
      title: picked.title,
      summary: ai.summary,
      source,
      url: picked.url,
      oneWord: ai.oneWord,
      pubDate,
    };
  }

  // Fallback: rotate through available articles by day
  if (unique.length > 0) {
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const pick = unique[day % unique.length];
    const source = (() => { try { return new URL(pick.url || fieldConfig.urls[0]).hostname.replace('www.', ''); } catch { return 'Research'; } })();
    return {
      field: fieldConfig.field,
      title: pick.title,
      summary: pick.desc || 'Tap to read the full article.',
      source,
      url: pick.url,
      oneWord: pick.title.split(' ').find(w => w.length > 5) ?? 'Insight',
      pubDate: '',
    };
  }

  return null;
}

export async function GET() {
  const results = await Promise.all(FIELDS.map(getFieldFinding));
  const findings = results.map((r, i) => r ?? FALLBACKS[i]);

  return NextResponse.json(findings, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
  });
}
