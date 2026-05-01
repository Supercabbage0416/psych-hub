import { NextResponse } from 'next/server';

export const runtime = 'edge'; // 30s limit vs 10s for serverless on Hobby plan

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

async function callDeepSeek(prompt: string, maxTokens = 400): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

// Extract JSON from text that may have prose before/after or markdown fences
function extractJson(text: string): unknown {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // Find first { and last } and try that slice
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* continue */ }
  }

  throw new Error(`Could not extract JSON from DeepSeek response: ${text.slice(0, 200)}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'findings') {
      const { categoryId, categoryLabel, categoryDescription, items } = body as {
        categoryId: string;
        categoryLabel: string;
        categoryDescription: string;
        items: { title: string; desc: string; url: string; pubDate: string }[];
      };

      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'No items' }, { status: 400 });
      }

      const articleList = items
        .slice(0, 5)
        .map((a, i) => `${i + 1}. "${a.title}"\n   ${a.desc.slice(0, 400)}`)
        .join('\n\n');

      const prompt = `You are selecting the single most useful psychology article for someone supporting their mental wellbeing.

Category: ${categoryLabel}
What this category is about: ${categoryDescription}

Your job:
1. Rank the 3 most relevant articles (reject anything off-topic, medical, AI/tech, political, or about diseases/drugs).
2. For the top-ranked article, write a clean 4-bullet summary.

Bullets (exactly this format):
- "What they found: ..." (core research finding, plain language, 1-2 sentences)
- "Why this happens: ..." (the mechanism or psychology behind it, 1-2 sentences)
- "What this means for you: ..." (personal relevance for stress/self-doubt/recovery, 1-2 sentences)
- "One thing to try: ..." (one small concrete action, 1 sentence)

Also provide:
- headline: One punchy human sentence capturing the finding (not academic)
- oneWord: One noun capturing the theme (e.g. "Resilience", "Rest", "Shame")

Articles:
${articleList}

Respond ONLY in valid JSON with no extra text:
{"rankings": [1, 2, 3], "headline": "...", "bullets": ["What they found: ...", "Why this happens: ...", "What this means for you: ...", "One thing to try: ..."], "oneWord": "..."}`;

      const text = await callDeepSeek(prompt, 400);
      const parsed = extractJson(text);
      return NextResponse.json(parsed);
    }

    if (body.type === 'insights') {
      const { stage, stageName, stageTagline, daysInStage, records, completionCounts, energyCounts } = body;

      const recordSummary = (records as { date: string; completion: string; energy: string; reflections: Record<string, string> }[])
        .map(r => {
          const lines = [`Date: ${r.date}`, `Completion: ${r.completion}`, `Energy: ${r.energy}`];
          Object.entries(r.reflections ?? {})
            .filter(([key, val]) => val && (val as string).length > 3 && !['completion', 'energy', 'effectiveness'].includes(key))
            .forEach(([key, val]) => lines.push(`${key}: ${val}`));
          return lines.join(' | ');
        })
        .join('\n');

      const prompt = `You are a gentle, non-judgmental behavioral coach reviewing someone's private personal recovery journal.

Context:
- Current recovery stage: ${stageName} — ${stageTagline}
- Days in this stage: ${daysInStage}
- Records analyzed: last ${records.length} days

Completion breakdown: ${JSON.stringify(completionCounts)}
Energy breakdown: ${JSON.stringify(energyCounts)}

Their personal reflections (private):
${recordSummary}

Based only on what you observe above, provide a warm and honest behavioral analysis:
1. themes: 2-3 recurring emotional or behavioral patterns you genuinely notice (be specific, not generic)
2. working: what seems to be going well or building momentum, even subtly
3. challenging: what seems to be most difficult or draining, based on patterns
4. growth: one specific, honest observation about change or progress — even if small
5. suggestion: one gentle, concrete suggestion for the next 7 days — something small and actionable

Be specific to their actual reflections. Avoid clinical language. Do not diagnose. Keep tone warm and human.

Respond ONLY in valid JSON with no extra text:
{"themes": ["...", "..."], "working": "...", "challenging": "...", "growth": "...", "suggestion": "..."}`;

      const text = await callDeepSeek(prompt, 700);
      const parsed = extractJson(text);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Summarize API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
