export const runtime = 'edge';

function extractJson(text: string): Record<string, string> | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export async function POST(req: Request) {
  const { text, mood, period, mode } = await req.json();
  if (!text || text.length < 10) return Response.json({ error: 'too short' }, { status: 400 });

  let prompt: string;

  if (mode === 'nudge') {
    // Journal entry mode: validate the feeling + suggest one concrete small step
    prompt = `Someone wrote this thought in their journal:
"${text}"

Do two things in plain, warm language:
1. In 1-2 sentences, honestly name what you hear in what they wrote — validate the feeling without minimising or toxic-positivity.
2. Suggest ONE small, concrete step they could take today that moves gently in the right direction. Keep it actionable and tiny — something achievable in under 10 minutes.

Return JSON only: {"nudge":"<validation sentence(s)> — <small step suggestion>"}`;
  } else {
    // ActReflect mode: reflect back + deepen question
    const context = period === 'night'
      ? `They checked in as feeling "${mood}" tonight.`
      : `They checked in as feeling "${mood}" this morning.`;

    prompt = `${context}

They wrote this reflection:
"${text}"

In 2 sentences max, reflect back what seems most real or alive in what they wrote — no advice, no reframing, just honest recognition. Then write one precise question (starting with "What" or "How") that might help them go one layer deeper. Keep language plain and warm.

Return JSON only: {"insight":"...","question":"..."}`;
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
      stream: false,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) return Response.json({ error: 'api error' }, { status: 500 });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(raw);
  if (!parsed) return Response.json({ error: 'parse error' }, { status: 500 });
  return Response.json(parsed);
}
