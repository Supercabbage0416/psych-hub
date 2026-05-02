export const runtime = 'edge';

function extractJson(text: string): Record<string, unknown> | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export async function POST(req: Request) {
  const { title, desc, source } = await req.json();
  if (!title) return Response.json({ error: 'missing title' }, { status: 400 });

  const material = desc?.trim() ? `${title}\n\n${desc}` : title;

  const prompt = `You are interpreting a psychology or wellbeing article for someone at the end of their day. Use this exact 4-part framework:

Article: "${material.slice(0, 800)}"
Source: ${source ?? 'unknown'}

Return JSON only with these four fields:

"finding" — One sentence. What the research or article actually found or claims. Start with "Research shows..." or "This article argues..." or similar. Max 25 words.

"meaning" — One to two sentences. What this finding implies about human behaviour, emotion, or daily life. No jargon. Max 35 words.

"tension" — One sentence. The honest nuance or limitation — what this does NOT mean, or where it gets complicated. Max 25 words.

"action" — One concrete thing someone could try today or this week based on this. Tiny and specific. Start with a verb. Max 20 words.

{
  "finding": "...",
  "meaning": "...",
  "tension": "...",
  "action": "..."
}`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.5,
      stream: false,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return Response.json({ error: 'api error' }, { status: 500 });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(raw);
  if (!parsed?.finding) return Response.json({ error: 'parse error' }, { status: 500 });
  return Response.json(parsed);
}
