'use client';

import { useEffect, useRef, useState } from 'react';
import FindingCard, { Finding } from './FindingCard';
import type { CategoryId } from '@/lib/articleCategories';
import { getCategoryById } from '@/lib/articleCategories';

interface RawItem { title: string; desc: string; url: string; pubDate: string; }
interface CategoryData {
  categoryId: CategoryId;
  categoryLabel: string;
  categoryDescription: string;
  items: RawItem[];
}

function toSource(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Research'; }
}
function toPubDate(raw: string) {
  if (!raw) return '';
  try { return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
}

async function selectBestArticle(cat: CategoryData): Promise<Finding | null> {
  if (cat.items.length === 0) return null;
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'findings',
        categoryId: cat.categoryId,
        categoryLabel: cat.categoryLabel,
        categoryDescription: cat.categoryDescription,
        items: cat.items,
      }),
    });
    if (!res.ok) return null;

    const parsed = await res.json();
    if (parsed.error) return null;

    const rankings: number[] = Array.isArray(parsed.rankings) ? parsed.rankings : [1];
    const topIdx = Math.max(0, (rankings[0] ?? 1) - 1);
    const picked = cat.items[topIdx] ?? cat.items[0];

    const alternates = rankings.slice(1, 3).map(rank => {
      const item = cat.items[Math.max(0, rank - 1)];
      if (!item) return null;
      return {
        title: item.title, url: item.url,
        source: toSource(item.url), pubDate: toPubDate(item.pubDate), desc: item.desc,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    return {
      categoryId: cat.categoryId,
      field: cat.categoryLabel,
      title: picked.title,
      headline: parsed.headline ?? picked.title,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      // legacy prose fields — kept for backwards compat
      summary: picked.desc,
      source: toSource(picked.url),
      url: picked.url,
      oneWord: parsed.oneWord ?? 'Insight',
      pubDate: toPubDate(picked.pubDate),
      alternates,
    };
  } catch { return null; }
}

function fallback(cat: CategoryData): Finding {
  const item = cat.items[0] ?? { title: 'No article found', desc: '', url: '', pubDate: '' };
  return {
    categoryId: cat.categoryId,
    field: cat.categoryLabel,
    title: item.title,
    headline: item.title,
    bullets: [],
    summary: item.desc || 'Tap "Full article" to read more.',
    source: toSource(item.url),
    url: item.url,
    oneWord: cat.categoryLabel.split(' ')[0],
    pubDate: toPubDate(item.pubDate),
  };
}

// Hardcoded fallbacks keyed by category, shown only if RSS fetch completely fails
const HARDCODED: Partial<Record<CategoryId, Finding>> = {
  behavioral_activation: {
    categoryId: 'behavioral_activation', field: 'Behavioral Activation',
    title: 'Habits form through context, not willpower',
    headline: 'Your environment shapes your habits more than your motivation does',
    bullets: [
      'What they found: Environment design predicts habit formation better than motivation or intention in repeated studies.',
      'Why this happens: The brain links behaviors to contextual cues — the same setting triggers the same behavior automatically.',
      'What this means for you: Changing where or when you do something is more effective than trying harder.',
      'One thing to try: Place one thing you want to do somewhere you will naturally see it today.',
    ],
    summary: '', source: 'bpsresearchdigest.com', url: 'https://bpsresearchdigest.com', oneWord: 'Habit', pubDate: '',
  },
  stress_recovery: {
    categoryId: 'stress_recovery', field: 'Stress & Recovery',
    title: 'Deliberate rest lowers cortisol more than distraction',
    headline: 'Sitting still does more for stress than scrolling ever will',
    bullets: [
      'What they found: Intentional rest — doing nothing on purpose — lowers cortisol more effectively than passive entertainment.',
      'Why this happens: The brain needs genuine downtime to restore cognitive resources; distraction delays this process.',
      'What this means for you: Rest is not a reward for finishing work. It is part of how recovery actually happens.',
      'One thing to try: Spend 10 minutes sitting without a screen or goal. Let the mind wander.',
    ],
    summary: '', source: 'mindful.org', url: 'https://mindful.org', oneWord: 'Rest', pubDate: '',
  },
  self_worth: {
    categoryId: 'self_worth', field: 'Self-Worth',
    title: 'Self-compassion predicts emotional resilience better than self-esteem',
    headline: 'Being kind to yourself works better than trying to feel good about yourself',
    bullets: [
      'What they found: Self-compassion — treating yourself with the kindness you would offer a friend — predicts emotional resilience more reliably than self-esteem.',
      'Why this happens: Self-esteem depends on success and comparison; self-compassion does not. It is unconditional.',
      'What this means for you: When you are struggling, the goal is not to feel better about yourself — it is to treat yourself as you would treat someone you care about.',
      'One thing to try: When something goes wrong today, ask: what would I say to a close friend in this situation?',
    ],
    summary: '', source: 'positivepsychology.com', url: 'https://positivepsychology.com', oneWord: 'Compassion', pubDate: '',
  },
  shame_embarrassment: {
    categoryId: 'shame_embarrassment', field: 'Shame & Embarrassment',
    title: 'Shame thrives in silence and dissolves in shared experience',
    headline: 'Shame loses its power the moment it is witnessed by someone safe',
    bullets: [
      'What they found: Shame is kept alive by secrecy and judgment. Sharing a shameful experience with a non-judgmental person reduces its intensity significantly.',
      'Why this happens: Shame is a social emotion — it is built in relationship and healed in relationship.',
      'What this means for you: You do not need to share everything publicly. One person who receives your story without judgment is enough.',
      'One thing to try: Notice one thing you are keeping private out of shame, not privacy. Ask if it would feel different if someone safe knew.',
    ],
    summary: '', source: 'greatergood.berkeley.edu', url: 'https://greatergood.berkeley.edu', oneWord: 'Shame', pubDate: '',
  },
  meaning_identity: {
    categoryId: 'meaning_identity', field: 'Meaning & Identity',
    title: 'Meaning is found in ordinary moments, not peak experiences',
    headline: 'Meaning comes from noticing — not from achieving something extraordinary',
    bullets: [
      'What they found: People who rate their lives as meaningful most often point to small, everyday moments — not major milestones.',
      'Why this happens: Meaning is constructed through attention and narrative, not through events themselves.',
      'What this means for you: Even a difficult week can contain meaningful moments if you know where to look.',
      'One thing to try: Name one ordinary thing that happened today that still mattered, however small.',
    ],
    summary: '', source: 'greatergood.berkeley.edu', url: 'https://greatergood.berkeley.edu', oneWord: 'Meaning', pubDate: '',
  },
};

interface Props {
  categories?: CategoryId[];
  reasonMap?: Partial<Record<CategoryId, string>>;
}

export default function DailyFindings({ categories = [], reasonMap = {} }: Props) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusIdx, setStatusIdx] = useState(0);
  const categoriesRef = useRef(categories);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    if (categories.length === 0) return; // wait for check-in
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `findings_v6_${today}_${[...categories].sort().join(',')}`;

    // Clean up all older cache versions
    Object.keys(localStorage).forEach(k => {
      if (/^findings_v[2-5]_/.test(k)) localStorage.removeItem(k);
    });

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setFindings(JSON.parse(cached)); setLoading(false); return; }
      catch { localStorage.removeItem(cacheKey); }
    }

    const queryString = categories.join(',');
    fetch(`/api/findings?categories=${queryString}`)
      .then(r => r.json())
      .then(async (catData: CategoryData[]) => {
        const results: Finding[] = [];
        for (let i = 0; i < catData.length; i++) {
          setStatusIdx(i);
          const cat = catData[i];
          const finding = cat.items.length > 0
            ? (await selectBestArticle(cat)) ?? fallback(cat)
            : (HARDCODED[cat.categoryId] ?? fallback(cat));
          results.push(finding);
        }
        localStorage.setItem(cacheKey, JSON.stringify(results));
        setFindings(results);
        setLoading(false);
      })
      .catch(() => {
        const fallbacks = categories.map(id => HARDCODED[id]).filter((f): f is Finding => !!f);
        setFindings(fallbacks.length > 0 ? fallbacks : Object.values(HARDCODED).slice(0, 2) as Finding[]);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join(',')]);

  if (categories.length === 0) return null;

  if (loading) {
    const catLabel = categories[statusIdx] ? getCategoryById(categories[statusIdx])?.label : '';
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100 text-center">
          <div className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-warm-600 text-sm font-medium">Finding the best article for you</p>
          {catLabel && (
            <p className="text-warm-300 text-xs mt-1">{catLabel}...</p>
          )}
        </div>
        {categories.slice(1).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-24 border border-warm-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((f, i) => (
        <div key={i}>
          {reasonMap[f.categoryId as CategoryId] && (
            <p className="text-xs text-sage font-medium mb-1.5 ml-1">
              {reasonMap[f.categoryId as CategoryId]}
            </p>
          )}
          <FindingCard finding={f} />
        </div>
      ))}
    </div>
  );
}
