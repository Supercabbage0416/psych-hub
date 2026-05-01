'use client';

import { useEffect, useState } from 'react';
import FindingCard, { Finding } from './FindingCard';

interface RawItem { title: string; desc: string; url: string; pubDate: string; }
interface FieldData { field: string; id: string; items: RawItem[]; }

const FIELD_DESCRIPTIONS: Record<string, string> = {
  'Behavioral': 'behavioral psychology, habits, emotions, cognitive patterns, motivation, decision-making, coping, mental health',
  'I/O & Work': 'workplace psychology, organizational behavior, leadership, team dynamics, employee wellbeing, job performance, burnout at work, productivity',
  'Group & Social': 'social psychology, group dynamics, conformity, peer influence, belonging, relationships, social identity, community',
  'Stress & Recovery': 'stress management, recovery, mindfulness, sleep, rest, resilience, emotional regulation, relaxation, self-care',
};

function toSource(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Research'; }
}
function toPubDate(raw: string) {
  if (!raw) return '';
  try { return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
}

async function deepseekSelect(
  field: string,
  items: RawItem[],
  apiKey: string
): Promise<Finding | null> {
  if (!apiKey || items.length === 0) return null;

  const articleList = items
    .map((a, i) => `${i + 1}. "${a.title}"\n   ${a.desc.slice(0, 300)}`)
    .join('\n\n');

  const prompt = `You are curating daily psychology content for someone building self-awareness and understanding of human behavior.

Field: ${field}
What belongs here: ${FIELD_DESCRIPTIONS[field] ?? field}

From the articles below, rank the TOP 3 most relevant to this exact field. Reject anything off-topic (medical conditions, AI technology, politics, climate, general science).

For the #1 ranked article, write a structured summary with these four sections:
- finding: The core research finding, stated precisely (2 sentences)
- context: The background or setting that makes this significant (1-2 sentences)
- population: Who this was studied on or who it affects (1 sentence)
- implication: What this means for everyday life and one concrete action to take (2 sentences)

Also choose ONE powerful word (noun or verb) that captures the essence.

Articles:
${articleList}

Respond ONLY in valid JSON with no markdown:
{"rankings": [1, 2, 3], "finding": "...", "context": "...", "population": "...", "implication": "...", "oneWord": "..."}`;

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
        max_tokens: 700,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error(`DeepSeek error for ${field}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? '').trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const rankings: number[] = Array.isArray(parsed.rankings) ? parsed.rankings : [1];
    const topIdx = Math.max(0, (rankings[0] ?? 1) - 1);
    const picked = items[topIdx] ?? items[0];

    // Build alternates from 2nd and 3rd ranked articles
    const alternates = rankings.slice(1, 3).map(rank => {
      const item = items[Math.max(0, rank - 1)];
      if (!item) return null;
      return { title: item.title, url: item.url, source: toSource(item.url), pubDate: toPubDate(item.pubDate), desc: item.desc };
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    const summary = [parsed.finding, parsed.context, parsed.population, parsed.implication]
      .filter(Boolean).join(' ');

    return {
      field,
      title: picked.title,
      summary: summary || picked.desc,
      finding: parsed.finding,
      context: parsed.context,
      population: parsed.population,
      implication: parsed.implication,
      source: toSource(picked.url),
      url: picked.url,
      oneWord: parsed.oneWord ?? 'Insight',
      pubDate: toPubDate(picked.pubDate),
      alternates,
    };
  } catch (e) {
    console.error(`DeepSeek parse error for ${field}:`, e);
    return null;
  }
}

function localFallback(field: string, items: RawItem[]): Finding {
  const item = items[0] ?? { title: 'No article found', desc: '', url: '', pubDate: '' };
  const source = (() => { try { return new URL(item.url).hostname.replace('www.', ''); } catch { return 'Research'; } })();
  return {
    field,
    title: item.title,
    summary: item.desc || 'Tap "Full article" to read more.',
    source,
    url: item.url,
    oneWord: item.title.split(' ').find(w => w.length > 5) ?? 'Insight',
    pubDate: '',
  };
}

const HARDCODED_FALLBACKS: Finding[] = [
  { field: 'Behavioral', title: 'Habits form through context cues, not willpower', summary: 'Research shows that environment design is more powerful than motivation for building lasting habits. The brain links behaviors to contexts — the same cue in the same setting will reliably trigger the same response. This means the most effective habit change comes from redesigning your surroundings, not trying harder. When we move homes or change jobs, habits often break because the context changes. One practical step: place what you want to do where you will naturally see it.', source: 'bpsresearchdigest.com', url: 'https://bpsresearchdigest.com', oneWord: 'Habit', pubDate: '' },
  { field: 'I/O & Work', title: 'Psychological safety predicts team innovation and learning', summary: 'Teams where people feel safe to speak up without fear of judgment consistently outperform those where they do not. Psychological safety is not about being nice — it creates conditions where honest input is welcomed and mistakes become learning opportunities. Leaders who respond to failure with curiosity rather than blame build cultures that improve over time. Research from Google found that safety was the single strongest predictor of team effectiveness. The simplest change: respond to bad news with questions, not judgment.', source: 'hbr.org', url: 'https://hbr.org', oneWord: 'Safety', pubDate: '' },
  { field: 'Group & Social', title: 'Social rejection activates the same brain regions as physical pain', summary: 'Being excluded or rejected by others triggers neural pathways that overlap significantly with those activated by physical pain. This is not a metaphor — social pain is real pain processed in a similar way by the brain. This evolutionary response made sense when belonging to a group was essential for survival. Today it means that loneliness or feeling left out genuinely hurts in a biological sense. Understanding this can help us extend more compassion to ourselves when social situations feel overwhelming.', source: 'sciencedaily.com', url: 'https://sciencedaily.com', oneWord: 'Belonging', pubDate: '' },
  { field: 'Stress & Recovery', title: 'Deliberate rest reduces cortisol more effectively than passive distraction', summary: 'Studies show that intentional rest — doing nothing with purpose — lowers cortisol levels more reliably than distracting yourself with screens or entertainment. The brain needs genuine downtime to consolidate experiences and restore cognitive resources. Distraction delays recovery; stillness accelerates it. Even 10 minutes of sitting quietly, without agenda, produces measurable physiological change. Rest is not a reward for finishing work — it is part of how the brain and body actually recover.', source: 'greatergood.berkeley.edu', url: 'https://greatergood.berkeley.edu', oneWord: 'Rest', pubDate: '' },
];

export default function DailyFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('Loading today\'s findings...');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `findings_v5_${today}`;
    const cached = localStorage.getItem(cacheKey);

    // Clean up older cache versions
    ['v2', 'v3', 'v4'].forEach(v => localStorage.removeItem(`findings_${v}_${today}`));

    if (cached) {
      try {
        setFindings(JSON.parse(cached));
        setLoading(false);
        return;
      } catch { localStorage.removeItem(cacheKey); }
    }

    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

    setStatus('Fetching latest psychology research...');
    fetch('/api/findings')
      .then(r => r.json())
      .then(async (fields: FieldData[]) => {
        setStatus('Selecting best articles with AI...');

        const results: Finding[] = [];

        for (let i = 0; i < fields.length; i++) {
          const { field, items } = fields[i];
          setStatus(`Reading ${field} findings (${i + 1}/4)...`);

          let finding: Finding | null = null;

          if (apiKey && items.length > 0) {
            finding = await deepseekSelect(field, items, apiKey);
          }

          if (!finding) {
            finding = items.length > 0
              ? localFallback(field, items)
              : HARDCODED_FALLBACKS[i];
          }

          results.push(finding);
        }

        localStorage.setItem(cacheKey, JSON.stringify(results));
        setFindings(results);
        setLoading(false);
      })
      .catch(() => {
        setFindings(HARDCODED_FALLBACKS);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-card border border-warm-100 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-warm-500 text-sm">{status}</p>
          <p className="text-warm-300 text-xs mt-1">DeepSeek is selecting the best articles for you</p>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse h-32 border border-warm-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((f, i) => <FindingCard key={i} finding={f} />)}
    </div>
  );
}
