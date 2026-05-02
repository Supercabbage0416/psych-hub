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

  const prompt = `You are summarizing a psychology or wellbeing article for someone at the end of their day.

Article: "${material.slice(0, 800)}"
Source: ${source ?? 'unknown'}

Write a concise in-app summary with exactly 3–4 bullet points. Each bullet should:
- Be one clear sentence (max 20 words)
- Capture the most practically useful insight
- Use plain, warm, non-clinical language

Also write one short "why this matters" sentence (max 20 words) for context.

Return JSON only:
{
  "bullets": ["...", "...", "..."],
  "why": "..."
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
  if (!Array.isArray(parsed?.bullets)) return Response.json({ error: 'parse error' }, { status: 500 });
  return Response.json(parsed);
}
