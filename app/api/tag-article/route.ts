export const runtime = 'edge';

function extractJson(text: string): Record<string, unknown> | null {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export async function POST(req: Request) {
  const { title, source } = await req.json();
  if (!title) return Response.json({ error: 'missing title' }, { status: 400 });

  const prompt = `Article title: "${title}"${source ? `\nSource: ${source}` : ''}

Suggest 3 to 5 short, lowercase tags for this psychology/wellbeing article. Tags should be single words or two-word phrases that describe the core topic (e.g. "anxiety", "sleep", "focus", "self-compassion", "burnout", "habits", "relationships", "stress", "motivation", "mindfulness").

Return JSON only: {"tags": ["tag1", "tag2", "tag3"]}`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.4,
      stream: false,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return Response.json({ tags: [] }, { status: 200 });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(raw);
  const tags = Array.isArray(parsed?.tags) ? (parsed.tags as string[]).slice(0, 5) : [];
  return Response.json({ tags });
}
