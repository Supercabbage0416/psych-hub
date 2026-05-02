export const runtime = 'edge';

function extractJson(text: string): Record<string, string> | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export async function POST(req: Request) {
  const { sessions } = await req.json();
  if (!sessions?.length) return Response.json({ error: 'no data' }, { status: 400 });

  const sessionSummary = sessions
    .slice(0, 14)
    .map((s: { date: string; mood: string; lesson?: string }) =>
      `${s.date}: mood=${s.mood}${s.lesson ? `, lesson="${s.lesson}"` : ''}`
    )
    .join('\n');

  const prompt = `Here are the user's recent check-in sessions:
${sessionSummary}

Identify the most honest patterns. Return JSON only:
{
  "moodArc": "one sentence — how their emotional tone has moved over time",
  "keyPattern": "one sentence — the most real recurring theme or tension you notice",
  "nudge": "one sentence of encouragement or honest reflection — anchored to the pattern, max 18 words",
  "action": "one concrete, small thing they could try today — specific, not generic"
}`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
      stream: false,
    }),
    signal: AbortSignal.timeout(22000),
  });

  if (!res.ok) return Response.json({ error: 'api error' }, { status: 500 });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(raw);
  if (!parsed?.nudge) return Response.json({ error: 'parse error' }, { status: 500 });
  return Response.json(parsed);
}
