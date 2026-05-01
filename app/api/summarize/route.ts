import { NextResponse } from 'next/server';

// Server-side DeepSeek proxy — key never exposed to browser
// Called by DailyFindings (article selection + summary) and AIInsights (pattern analysis)

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const FIELD_DESCRIPTIONS: Record<string, string> = {
  'Behavioral': 'behavioral psychology, habits, emotions, cognitive patterns, motivation, decision-making, coping, mental health',
  'I/O & Work': 'workplace psychology, organizational behavior, leadership, team dynamics, employee wellbeing, job performance, burnout at work, productivity',
  'Group & Social': 'social psychology, group dynamics, conformity, peer influence, belonging, relationships, social identity, community',
  'Stress & Recovery': 'stress management, recovery, mindfulness, sleep, rest, resilience, emotional regulation, relaxation, self-care',
};

async function callDeepSeek(prompt: string, maxTokens = 700): Promise<string> {
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
  return (data.choices?.[0]?.message?.content ?? '').trim().replace(/```json\n?|\n?```/g, '').trim();
}

// POST /api/summarize
// Body: { type: 'findings', field, items } | { type: 'insights', stage, daysInStage, records }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'findings') {
      const { field, items } = body as {
        field: string;
        items: { title: string; desc: string; url: string; pubDate: string }[];
      };

      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'No items' }, { status: 400 });
      }

      const articleList = items
        .map((a: { title: string; desc: string }, i: number) =>
          `${i + 1}. "${a.title}"\n   ${a.desc.slice(0, 800)}`
        )
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

      const text = await callDeepSeek(prompt, 700);
      const parsed = JSON.parse(text);
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

Respond ONLY in valid JSON with no markdown:
{"themes": ["...", "..."], "working": "...", "challenging": "...", "growth": "...", "suggestion": "..."}`;

      const text = await callDeepSeek(prompt, 600);
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Summarize API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
