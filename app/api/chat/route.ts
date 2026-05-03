export const runtime = 'edge';

// DeepSeek V3 (deepseek-chat) — best conversational model from DeepSeek
const MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `You are a warm, perceptive thinking partner helping someone process their everyday thoughts and feelings.

Your role:
- Listen deeply and reflect back what you hear
- Ask one good question at a time to help them go further
- Validate without toxic positivity — be honest, not just reassuring
- Keep responses concise (3–5 sentences max unless they need more)
- Speak plainly, warmly, like a thoughtful friend who also understands psychology
- Never give unsolicited advice; help them find their own clarity

When asked to summarise: produce a clear, kind 3–5 bullet summary of the conversation's key insights.`;

export async function POST(req: Request) {
  const { messages, mode } = await req.json();
  // messages = [{ role: 'user'|'assistant', content: string }]

  if (mode === 'summary') {
    const transcript = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n');

    const summaryPrompt = `Summarise this conversation in 3–5 bullet points. Focus on the key insights the person arrived at, any patterns noticed, and one suggested next step.\n\nConversation:\n${transcript.slice(0, 3000)}\n\nReturn JSON only: {"bullets": ["...", "..."], "next_step": "..."}`;

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 300, temperature: 0.4, stream: false,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return Response.json({ error: 'api error' }, { status: 500 });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (parsed?.bullets) return Response.json(parsed);
    } catch { /* fall through */ }
    return Response.json({ bullets: [raw], next_step: '' });
  }

  // Normal chat
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-12), // keep last 12 turns for context
      ],
      max_tokens: 300,
      temperature: 0.75,
      stream: false,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) return Response.json({ error: 'api error' }, { status: 500 });
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? '';
  return Response.json({ reply });
}
