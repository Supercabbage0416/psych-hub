import { NextResponse } from 'next/server';

export const runtime = 'edge';

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.6,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
}

export async function POST(req: Request) {
  try {
    const { stageName, mood, recommendation } = await req.json();

    const prompt = `You are a behavioral coach writing one focused action sentence for today.

Recovery stage: ${stageName}
Current mood: ${mood}
Their weekly plan: "${recommendation}"

Write ONE sentence (under 20 words) that:
- References something specific from their weekly plan
- Starts with "Today," or a concrete verb
- Feels personal and warm, not clinical or generic

Respond with ONLY the sentence. No quotes. No labels. No extra text.`;

    const nudge = await callDeepSeek(prompt);
    return NextResponse.json({ nudge });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
