import { NextResponse } from 'next/server';

export const runtime = 'edge';

function extractJson(text: string): unknown {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* continue */ }
  }
  throw new Error(`Could not parse JSON: ${text.slice(0, 200)}`);
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

export async function POST(req: Request) {
  try {
    const { date, thoughts } = await req.json() as {
      date: string;
      thoughts: { content: string; created_at: string }[];
    };

    if (!thoughts || thoughts.length === 0) {
      return NextResponse.json({ error: 'No thoughts to organize' }, { status: 400 });
    }

    const thoughtText = thoughts
      .map(t => `[${t.created_at.slice(11, 16)}] ${t.content}`)
      .join('\n');

    const prompt = `You are reviewing someone's private raw thoughts captured throughout a single day.

Date: ${date}
Number of thoughts: ${thoughts.length}
Thoughts (time-ordered):
${thoughtText}

Synthesize this day honestly and warmly. Be specific — reference what they actually wrote.

Provide:
1. themes: 2-3 brief phrases capturing recurring psychological themes
2. mood_arc: one sentence on how the emotional tone seemed to shift through the day
3. key_insight: the single most psychologically significant thing they expressed today
4. actions: 0-2 small concrete things worth trying tomorrow based on what you see (empty array if nothing specific)
5. summary: 2-3 sentences synthesizing their inner day — honest, warm, non-clinical

Respond ONLY in valid JSON:
{"themes": ["...", "..."], "mood_arc": "...", "key_insight": "...", "actions": [], "summary": "..."}`;

    const text = await callDeepSeek(prompt);
    const parsed = extractJson(text);
    return NextResponse.json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
