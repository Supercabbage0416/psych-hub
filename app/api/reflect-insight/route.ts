import { NextResponse } from 'next/server';

async function callDeepSeek(prompt: string, maxTokens = 800): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim().replace(/```json\n?|\n?```/g, '').trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Analyze: extract mood/motivation/status + generate recommendation ──
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

      const prompt = `You are a warm, psychologically-informed personal coach reading someone's private journal and recovery data to understand where they truly are right now.

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

1. mood: One word or short phrase capturing their dominant emotional state right now (not a clinical label — something human like "exhausted but trying", "quietly anxious", "slowly steadying")
2. motivation: The core thing that seems to be driving or blocking them right now — one sentence
3. status: A 1-sentence honest assessment of where they are in their recovery/wellbeing journey
4. recommendation: A specific, adapted 3-4 sentence plan for this week based on what you see. It should address their actual patterns, not generic advice. Be direct but kind.
5. reasoning: 1-2 sentences explaining WHY you're recommending this, connecting it to what you actually observed in their data

Respond ONLY in valid JSON with no markdown:
{"mood": "...", "motivation": "...", "status": "...", "recommendation": "...", "reasoning": "..."}`;

      const text = await callDeepSeek(prompt, 600);
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    }

    // ── Respond: continue conversation after user comments on recommendation ──
    if (body.type === 'respond') {
      const { thread, userComment, mood, motivation, status, recommendation } = body;

      const threadText = (thread as { role: string; content: string }[])
        .map(m => `${m.role === 'ai' ? 'Coach' : 'You'}: ${m.content}`)
        .join('\n\n');

      const prompt = `You are a warm personal coach in an ongoing conversation with someone about their weekly plan and wellbeing.

Context about them right now:
- Mood: ${mood}
- Core motivation/block: ${motivation}
- Status: ${status}

The plan you suggested:
"${recommendation}"

Conversation so far:
${threadText}

Their latest message:
"${userComment}"

Respond naturally as a coach. You can:
- Accept their pushback and adjust the recommendation
- Validate their concern and offer a gentler alternative
- Ask one clarifying question if needed
- Affirm what they said and build on it

Keep your response to 2-4 sentences. Be direct, warm, and specific. Do not use bullet points.`;

      const response = await callDeepSeek(prompt, 300);
      return NextResponse.json({ response });
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('reflect-insight error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
