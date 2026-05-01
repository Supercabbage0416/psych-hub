import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  const result: Record<string, unknown> = {
    deepseek_key: apiKey ? `set (${apiKey.slice(0, 10)}...)` : 'MISSING',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
  };

  // Live test — send a minimal request to DeepSeek
  if (apiKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Reply with exactly: {"ok": true}' }],
          max_tokens: 20,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const choice = data.choices?.[0];
        const content = choice?.message?.content ?? '';
        const reasoning = choice?.message?.reasoning_content ?? '';
        result.deepseek_test = 'PASS';
        result.deepseek_response = content;
        result.deepseek_reasoning = reasoning ? reasoning.slice(0, 100) : '(none)';
        result.deepseek_raw_message = choice?.message ?? '(no choice)';
      } else {
        const err = await res.text();
        result.deepseek_test = `FAIL (${res.status})`;
        result.deepseek_error = err.slice(0, 300);
      }
    } catch (e) {
      result.deepseek_test = 'FAIL (exception)';
      result.deepseek_error = e instanceof Error ? e.message : String(e);
    }
  } else {
    result.deepseek_test = 'SKIPPED (no key)';
  }

  return NextResponse.json(result);
}
