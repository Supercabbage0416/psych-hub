import { NextResponse } from 'next/server';

export const maxDuration = 60; // seconds — Vercel hobby allows up to 60

async function callDeepSeek(prompt: string, maxTokens = 800): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}

// Extract JSON from text that may have prose before/after or markdown fences
function extractJson(text: string): unknown {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try { return JSON.parse(cleaned); } catch { /* continue */ }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* continue */ }
  }

  throw new Error(`Could not extract JSON from response: ${text.slice(0, 200)}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'analyze') {
      const { journals, moods, weeklyReflections, recoveryRecords, recoveryStage } = body;

      const journalText = (journals as { content: string; created_at: string }[])
        .slice(0, 10)
        .map(j => `[${j.created_at?.slice(0, 10)}] ${j.content}`)
        .join('\n');

      const moodText = (moods as { mood: string; created_at: string }[])
        .map(m => `${m.created_at?.slice(0, 10)}: ${m.mood}`)
        .join(', ');

      const reflectionText = (weeklyReflections as { content: string; observation: string }[])
        .slice(0, 2)
        .map(r => `Reflection: ${r.content}\nObservation: ${r.observation}`)
        .join('\n\n');

      const recoveryText = (recoveryRecords as { date: string; completion: string; energy: string; reflections: Record<string, string> }[])
        .slice(-7)
        .map(r => {
          const texts = Object.entries(r.reflections ?? {})
            .filter(([k, v]) => v && (v as string).length > 3 && !['completion', 'energy', 'effectiveness'].includes(k))
            .map(([, v]) => v).join('; ');
          return `${r.date}: energy=${r.energy}, completion=${r.completion}${texts ? ', wrote: ' + texts : ''}`;
        })
        .join('\n');

      const prompt = `You are a warm, psychologically-informed personal coach reading someone's private journal and recovery data.

Here is their data from the past 2 weeks:

MOOD LOG:
${moodText || 'No moods recorded'}

JOURNAL ENTRIES:
${journalText || 'No journal entries'}

WEEKLY REFLECTION:
${reflectionText || 'None this week'}

RECOVERY STAGE: ${recoveryStage || 'Not started'}
RECOVERY LOG (last 7 days):
${recoveryText || 'No recovery records'}

Based on ALL of this, extract and respond with:
1. mood: One short phrase capturing their dominant emotional state (human, not clinical — e.g. "exhausted but trying", "quietly anxious")
2. motivation: The core thing driving or blocking them right now — one sentence
3. status: A 1-sentence honest assessment of where they are in their wellbeing journey
4. recommendation: A specific 3-4 sentence plan for this week based on what you see. Address actual patterns, not generic advice.
5. reasoning: 1-2 sentences explaining WHY you recommend this, connecting to what you observed

Respond ONLY in valid JSON with no extra text:
{"mood": "...", "motivation": "...", "status": "...", "recommendation": "...", "reasoning": "..."}`;

      const text = await callDeepSeek(prompt, 800);
      const parsed = extractJson(text);
      return NextResponse.json(parsed);
    }

    if (body.type === 'respond') {
      const { thread, userComment, mood, motivation, status, recommendation } = body;

      const threadText = (thread as { role: string; content: string }[])
        .map(m => `${m.role === 'ai' ? 'Coach' : 'You'}: ${m.content}`)
        .join('\n\n');

      const prompt = `You are a warm personal coach in an ongoing conversation about someone's weekly plan.

Context:
- Mood: ${mood}
- Core motivation/block: ${motivation}
- Status: ${status}

The plan you suggested:
"${recommendation}"

Conversation so far:
${threadText}

Their latest message: "${userComment}"

Respond naturally as a coach — accept pushback, offer gentler alternatives, ask one clarifying question if needed, or affirm and build on what they said. Keep to 2-4 sentences. Be direct, warm, specific. No bullet points.`;

      const response = await callDeepSeek(prompt, 350);
      return NextResponse.json({ response });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('reflect-insight error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
